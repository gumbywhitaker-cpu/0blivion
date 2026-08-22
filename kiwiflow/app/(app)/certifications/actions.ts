"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";
import { recordAuditLog } from "@/lib/audit";
import { CERTIFICATION_SCHEMES, CERTIFICATION_STATUSES } from "@/lib/types";

export type FormState = { error?: string } | undefined;

const certificationSchema = z.object({
  orchardId: z.string().min(1),
  scheme: z.enum(CERTIFICATION_SCHEMES),
  certificateNumber: z.string().trim().max(100).optional(),
  ggn: z.string().trim().max(50).optional(),
  status: z.enum(CERTIFICATION_STATUSES),
  issuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

/** Growers only — a certification is issued to the orchard's owning
 * business, not a contractor working on it. Creates a new record rather
 * than updating in place, so an annual re-certification stays a real
 * history instead of overwriting the previous audit's evidence. */
export async function createCertificationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "GROWER") return { error: "Only grower organisations manage certifications" };
  assertCanManage(session.role);

  const parsed = certificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const orchard = await prisma.orchard.findFirst({
    where: { id: data.orchardId, organizationId: session.organizationId },
  });
  if (!orchard) return { error: "Orchard not found" };

  const cert = await prisma.certification.create({
    data: {
      orchardId: data.orchardId,
      scheme: data.scheme,
      certificateNumber: data.certificateNumber || null,
      ggn: data.ggn || null,
      status: data.status,
      issuedDate: data.issuedDate ? new Date(data.issuedDate) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      notes: data.notes || null,
      createdById: session.userId,
    },
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "certification.recorded",
    entityType: "Certification",
    entityId: cert.id,
    detail: { orchardId: data.orchardId, scheme: data.scheme, status: data.status },
  });

  revalidatePath(`/orchards/${data.orchardId}`);
  revalidatePath("/certifications");
}

const statusUpdateSchema = z.object({
  certificationId: z.string().min(1),
  status: z.enum(CERTIFICATION_STATUSES),
  certificateNumber: z.string().trim().max(100).optional(),
  expiryDate: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function updateCertificationStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "GROWER") return { error: "Only grower organisations manage certifications" };
  assertCanManage(session.role);

  const parsed = statusUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { certificationId, status, certificateNumber, expiryDate, notes } = parsed.data;

  const cert = await prisma.certification.findFirst({
    where: { id: certificationId, orchard: { organizationId: session.organizationId } },
  });
  if (!cert) return { error: "Certification not found" };

  await prisma.certification.update({
    where: { id: cert.id },
    data: {
      status,
      certificateNumber: certificateNumber || cert.certificateNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : cert.expiryDate,
      notes: notes || cert.notes,
    },
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "certification.status_changed",
    entityType: "Certification",
    entityId: cert.id,
    detail: { fromStatus: cert.status, toStatus: status },
  });

  revalidatePath(`/orchards/${cert.orchardId}`);
  revalidatePath("/certifications");
}
