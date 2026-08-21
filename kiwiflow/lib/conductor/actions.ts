import { prisma } from "@/lib/db";
import { createInvoiceDraftForJob } from "@/lib/invoicing";
import { notifyOrgOwners } from "@/lib/notify";
import type { ConductorEvent } from "@/lib/conductor/events";
import type { NotificationUrgency } from "@/lib/types";

/**
 * Fixed, typed action registry (docs/BLUEPRINT.md Section 6). WorkflowRule.actions is
 * stored as JSON, but the action names it references are looked up here against
 * compiled TypeScript functions — never `eval`'d or dynamically imported from stored
 * data. A rule can configure *which* actions run and with what params; it cannot
 * introduce new code.
 */

type ActionContext = {
  organizationId: string;
  event: ConductorEvent;
};

type ActionParams = Record<string, unknown>;

type ActionFn = (ctx: ActionContext, params: ActionParams) => Promise<void>;

async function createInvoiceDraft(ctx: ActionContext): Promise<void> {
  if (ctx.event.type !== "JOB_COMPLETED") return;
  const invoice = await createInvoiceDraftForJob(ctx.event.payload.jobId);
  if (!invoice) return; // no contractor on the job — nothing to bill

  const job = await prisma.job.findUnique({ where: { id: ctx.event.payload.jobId } });
  await notifyOrgOwners({
    organizationId: ctx.organizationId,
    title: "Job completed — invoice drafted",
    body: `${job?.jobType ?? "Job"} at your orchard is complete. Draft invoice ${invoice.invoiceNumber} for ${invoice.total.toFixed(2)} is ready to send.`,
    urgency: "NORMAL",
    jobId: job?.id,
  });
}

async function notifyOwners(ctx: ActionContext, params: ActionParams): Promise<void> {
  const title = typeof params.title === "string" ? params.title : "KiwiFlow update";
  const body = typeof params.body === "string" ? params.body : JSON.stringify(ctx.event.payload);
  const urgency = (params.urgency as NotificationUrgency | undefined) ?? "NORMAL";
  await notifyOrgOwners({ organizationId: ctx.organizationId, title, body, urgency });
}

async function notifyCoolstoreAlert(ctx: ActionContext): Promise<void> {
  if (ctx.event.type !== "COOLSTORE_TEMP_ALERT") return;
  const { facilityName, temperatureC } = ctx.event.payload;
  await notifyOrgOwners({
    organizationId: ctx.organizationId,
    title: "Coolstore temperature out of range",
    body: `${facilityName} logged at ${temperatureC.toFixed(1)}°C, outside the configured safe range. Check the fruit and the unit now.`,
    urgency: "CRITICAL",
  });
}

async function notifyMaterialOrderUpdate(ctx: ActionContext): Promise<void> {
  if (
    ctx.event.type !== "MATERIAL_ORDER_SUBMITTED" &&
    ctx.event.type !== "MATERIAL_ORDER_CONFIRMED" &&
    ctx.event.type !== "MATERIAL_ORDER_DELIVERED"
  ) {
    return;
  }
  const order = await prisma.materialOrder.findUnique({
    where: { id: ctx.event.payload.materialOrderId },
    include: { supplier: true },
  });
  if (!order) return;

  const verb: Record<typeof ctx.event.type, string> = {
    MATERIAL_ORDER_SUBMITTED: "submitted to",
    MATERIAL_ORDER_CONFIRMED: "confirmed by",
    MATERIAL_ORDER_DELIVERED: "delivered by",
  };

  const statusLine =
    ctx.event.type === "MATERIAL_ORDER_DELIVERED"
      ? "has arrived."
      : ctx.event.type === "MATERIAL_ORDER_CONFIRMED"
        ? "was confirmed by the supplier."
        : "was submitted and is awaiting confirmation.";

  await notifyOrgOwners({
    organizationId: ctx.organizationId,
    title: `Material order ${verb[ctx.event.type]} ${order.supplier.name}`,
    body: `Your $${order.subtotal.toFixed(2)} order from ${order.supplier.name} ${statusLine}`,
    urgency: "NORMAL",
  });
}

export const ACTIONS: Record<string, ActionFn> = {
  createInvoiceDraft,
  notifyOwners,
  notifyCoolstoreAlert,
  notifyMaterialOrderUpdate,
};
