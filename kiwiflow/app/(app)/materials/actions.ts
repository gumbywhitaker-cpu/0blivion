"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";
import { emitEvent } from "@/lib/conductor/emit";
import { recordAuditLog } from "@/lib/audit";
import {
  SUPPLIER_CATEGORIES,
  MATERIAL_ORDER_STATUS_TRANSITIONS,
  type MaterialOrderStatus,
} from "@/lib/types";

export type FormState = { error?: string } | undefined;

const createSupplierSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  category: z.enum(SUPPLIER_CATEGORIES),
  contactName: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional(),
});

export async function createSupplierAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assertCanManage(session.role);

  const parsed = createSupplierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.supplier.create({
    data: {
      organizationId: session.organizationId,
      name: data.name,
      category: data.category,
      contactName: data.contactName || null,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/materials/suppliers");
  redirect("/materials/suppliers");
}

const orderItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().trim().min(1),
  unitPrice: z.coerce.number().min(0),
});

const createOrderSchema = z.object({
  supplierId: z.string().min(1, "Choose a supplier"),
  orchardId: z.string().optional(),
  requestedDeliveryDate: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
  itemsJson: z.string().min(1),
});

export async function createMaterialOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assertCanManage(session.role);

  const rawParsed = createOrderSchema.safeParse(Object.fromEntries(formData));
  if (!rawParsed.success) {
    return { error: rawParsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(rawParsed.data.itemsJson);
  } catch {
    return { error: "Invalid line items" };
  }
  const itemsParsed = z.array(orderItemSchema).min(1, "Add at least one line item").safeParse(itemsRaw);
  if (!itemsParsed.success) {
    return { error: itemsParsed.error.issues[0]?.message ?? "Invalid line items" };
  }

  const data = { ...rawParsed.data, items: itemsParsed.data };

  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, organizationId: session.organizationId },
  });
  if (!supplier) return { error: "Supplier not found" };

  if (data.orchardId) {
    const orchard = await prisma.orchard.findFirst({
      where: { id: data.orchardId, organizationId: session.organizationId },
    });
    if (!orchard) return { error: "Orchard not found" };
  }

  const itemsWithAmounts = data.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
  }));
  const subtotal = Math.round(itemsWithAmounts.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;

  const order = await prisma.materialOrder.create({
    data: {
      organizationId: session.organizationId,
      supplierId: data.supplierId,
      orchardId: data.orchardId || null,
      requestedDeliveryDate: data.requestedDeliveryDate ? new Date(data.requestedDeliveryDate) : null,
      notes: data.notes || null,
      subtotal,
      createdById: session.userId,
      items: { create: itemsWithAmounts },
    },
  });

  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "material_order.created",
    entityType: "MaterialOrder",
    entityId: order.id,
    detail: { supplierId: order.supplierId, subtotal: order.subtotal },
  });

  redirect(`/materials/${order.id}`);
}

const transitionSchema = z.object({
  orderId: z.string().min(1),
  toStatus: z.string().min(1),
});

const EVENT_FOR_STATUS: Record<string, "MATERIAL_ORDER_SUBMITTED" | "MATERIAL_ORDER_CONFIRMED" | "MATERIAL_ORDER_DELIVERED" | undefined> = {
  SUBMITTED: "MATERIAL_ORDER_SUBMITTED",
  CONFIRMED: "MATERIAL_ORDER_CONFIRMED",
  DELIVERED: "MATERIAL_ORDER_DELIVERED",
};

export async function transitionMaterialOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assertCanManage(session.role);

  const parsed = transitionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { orderId, toStatus } = parsed.data;

  const order = await prisma.materialOrder.findFirst({
    where: { id: orderId, organizationId: session.organizationId },
  });
  if (!order) return { error: "Order not found" };

  const fromStatus = order.status as MaterialOrderStatus;
  const target = toStatus as MaterialOrderStatus;

  if (!MATERIAL_ORDER_STATUS_TRANSITIONS[fromStatus]?.includes(target)) {
    return { error: `Cannot move an order from ${fromStatus} to ${target}` };
  }

  await prisma.materialOrder.update({
    where: { id: order.id },
    data: {
      status: target,
      ...(target === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    },
  });

  // MaterialOrder has no dedicated history table the way Job does
  // (JobStatusHistory) — the generic audit log is the only record of who
  // moved this order between statuses.
  await recordAuditLog({
    organizationId: session.organizationId,
    actorId: session.userId,
    action: "material_order.status_changed",
    entityType: "MaterialOrder",
    entityId: order.id,
    detail: { fromStatus, toStatus: target },
  });

  const eventType = EVENT_FOR_STATUS[target];
  if (eventType) {
    await emitEvent(session.organizationId, { type: eventType, payload: { materialOrderId: order.id } });
  }

  revalidatePath(`/materials/${order.id}`);
  revalidatePath("/materials");
}
