"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/audit";
import { EXPORT_SHIPMENT_MODES, EXPORT_SHIPMENT_TRANSITIONS, type ExportShipmentStatus } from "@/lib/types";

export type FormState = { error?: string } | undefined;

const createSchema = z.object({
  mode: z.enum(EXPORT_SHIPMENT_MODES),
  transportOrgId: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

/** A pack house starts a shipment before it necessarily knows every detail —
 * the transport/wharf operator can be picked later if it isn't settled yet. */
export async function createExportShipmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") {
    return { error: "Only pack house organisations create export shipments" };
  }

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  if (data.transportOrgId) {
    const transportOrg = await prisma.organization.findFirst({
      where: { id: data.transportOrgId, type: "TRANSPORT" },
    });
    if (!transportOrg) return { error: "Choose a valid transport organisation" };
  }

  const shipment = await prisma.exportShipment.create({
    data: {
      packhouseOrgId: session.organizationId,
      transportOrgId: data.transportOrgId || null,
      mode: data.mode,
      notes: data.notes || null,
      createdById: session.userId,
      statusHistory: { create: { toStatus: "PREPARING" } },
    },
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "export_shipment.created",
    entityType: "ExportShipment",
    entityId: shipment.id,
    detail: { mode: data.mode },
  });

  revalidatePath("/export");
  redirect(`/export/${shipment.id}`);
}

const attachSchema = z.object({
  shipmentId: z.string().min(1),
  gradingResultId: z.string().min(1),
});

/** Consolidates a graded, un-shipped load into a shipment. A container/reefer
 * hold is routinely built from several orchards'/growers' loads — that's
 * exactly why this is a many-to-one attach, not a 1:1 field on the job. */
export async function attachGradingResultAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") {
    return { error: "Only pack house organisations manage shipment contents" };
  }
  const parsed = attachSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input" };
  const data = parsed.data;

  const shipment = await prisma.exportShipment.findFirst({
    where: { id: data.shipmentId, packhouseOrgId: session.organizationId },
  });
  if (!shipment) return { error: "Shipment not found" };

  const grading = await prisma.gradingResult.findFirst({
    where: { id: data.gradingResultId, organizationId: session.organizationId, exportShipmentId: null },
  });
  if (!grading) return { error: "That load isn't available to attach — it may already be on another shipment" };

  await prisma.gradingResult.update({ where: { id: grading.id }, data: { exportShipmentId: shipment.id } });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "export_shipment.load_attached",
    entityType: "ExportShipment",
    entityId: shipment.id,
    detail: { gradingResultId: grading.id },
  });

  revalidatePath(`/export/${shipment.id}`);
}

const detailsSchema = z.object({
  shipmentId: z.string().min(1),
  transportOrgId: z.string().optional(),
  palletCount: z.string().optional(),
  containerNumber: z.string().trim().max(20).optional(),
  carrierBookingReference: z.string().trim().max(100).optional(),
  shippingLine: z.string().trim().max(100).optional(),
  vesselName: z.string().trim().max(100).optional(),
  voyageNumber: z.string().trim().max(50).optional(),
  destinationPort: z.string().trim().max(200).optional(),
  reeferSetpointC: z.string().optional(),
  etd: z.string().optional(),
  phytosanitaryCertificateNumber: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});

/** Either party involved (the pack house that created it, or the transport
 * org handling it) can fill in details as they become known — a real
 * shipment's container number, vessel, and ETD are rarely all known up
 * front. */
export async function updateExportShipmentDetailsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = detailsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input" };
  const data = parsed.data;

  const shipment = await prisma.exportShipment.findFirst({
    where: {
      id: data.shipmentId,
      OR: [{ packhouseOrgId: session.organizationId }, { transportOrgId: session.organizationId }],
    },
  });
  if (!shipment) return { error: "Shipment not found" };

  if (data.transportOrgId) {
    const transportOrg = await prisma.organization.findFirst({ where: { id: data.transportOrgId, type: "TRANSPORT" } });
    if (!transportOrg) return { error: "Choose a valid transport organisation" };
  }

  const palletCount = data.palletCount ? Number.parseInt(data.palletCount, 10) : NaN;
  const reeferSetpointC = data.reeferSetpointC ? Number.parseFloat(data.reeferSetpointC) : NaN;

  await prisma.exportShipment.update({
    where: { id: shipment.id },
    data: {
      transportOrgId: data.transportOrgId || shipment.transportOrgId,
      palletCount: Number.isFinite(palletCount) ? palletCount : null,
      containerNumber: data.containerNumber || null,
      carrierBookingReference: data.carrierBookingReference || null,
      shippingLine: data.shippingLine || null,
      vesselName: data.vesselName || null,
      voyageNumber: data.voyageNumber || null,
      destinationPort: data.destinationPort || null,
      reeferSetpointC: Number.isFinite(reeferSetpointC) ? reeferSetpointC : shipment.reeferSetpointC,
      etd: data.etd ? new Date(data.etd) : null,
      phytosanitaryCertificateNumber: data.phytosanitaryCertificateNumber || null,
      notes: data.notes || null,
    },
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "export_shipment.details_updated",
    entityType: "ExportShipment",
    entityId: shipment.id,
  });

  revalidatePath(`/export/${shipment.id}`);
}

const transitionSchema = z.object({
  shipmentId: z.string().min(1),
  toStatus: z.string().min(1),
});

/** PREPARING -> IN_TRANSIT_TO_WHARF is the pack house dispatching the truck;
 * everything from IN_TRANSIT_TO_WHARF onward is the transport org's wharf
 * operation (their own coolstore, their own vessel loading) — see
 * EXPORT_SHIPMENT_TRANSITIONS. Each step is gated to whichever org actually
 * owns it in the real world, not just "anyone on the shipment." */
export async function transitionExportShipmentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = transitionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input" };
  const data = parsed.data;

  const shipment = await prisma.exportShipment.findFirst({
    where: {
      id: data.shipmentId,
      OR: [{ packhouseOrgId: session.organizationId }, { transportOrgId: session.organizationId }],
    },
  });
  if (!shipment) return { error: "Shipment not found" };

  const fromStatus = shipment.status as ExportShipmentStatus;
  const toStatus = data.toStatus as ExportShipmentStatus;
  const allowed = EXPORT_SHIPMENT_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(toStatus)) return { error: `Cannot move from ${fromStatus} to ${toStatus}` };

  const isPackhouseStep = toStatus === "IN_TRANSIT_TO_WHARF";
  if (isPackhouseStep && session.organizationId !== shipment.packhouseOrgId) {
    return { error: "Only the pack house dispatches this shipment" };
  }
  if (!isPackhouseStep) {
    if (!shipment.transportOrgId || session.organizationId !== shipment.transportOrgId) {
      return { error: "Only the assigned transport organisation can update this step" };
    }
  }

  await prisma.exportShipment.update({ where: { id: shipment.id }, data: { status: toStatus } });
  await prisma.exportShipmentStatusHistory.create({
    data: { exportShipmentId: shipment.id, fromStatus, toStatus, changedById: session.userId },
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "export_shipment.status_changed",
    entityType: "ExportShipment",
    entityId: shipment.id,
    detail: { fromStatus, toStatus },
  });

  revalidatePath(`/export/${shipment.id}`);
  revalidatePath("/export");
}
