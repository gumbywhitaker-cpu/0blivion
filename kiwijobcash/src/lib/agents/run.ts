import "server-only";
import { prisma } from "@/lib/db";
import { runLeadRecoveryAgent } from "@/lib/agents/leadRecovery";
import { runQuoteRecoveryAgent } from "@/lib/agents/quoteRecovery";
import { runInvoiceRecoveryAgent } from "@/lib/agents/invoiceRecovery";
import { runCustomerReactivationAgent } from "@/lib/agents/customerReactivation";
import { runProfitRadarAgent } from "@/lib/agents/profitRadar";
import type { ActionCandidate } from "@/lib/agents/types";

/**
 * Runs every recovery agent for a business and upserts AIAction rows.
 *
 * Idempotency rule: if any AIAction already exists for a given
 * (businessId, type, entityType, entityId), we never create a duplicate —
 * we only refresh the estimate/message while it's still PENDING. Once a
 * human has approved, sent, dismissed, or completed it, agents leave it
 * alone. This keeps the Action Centre stable instead of resurrecting
 * dismissed suggestions every page load.
 */
export async function runAgents(businessId: string) {
  const results = await Promise.all([
    runLeadRecoveryAgent(businessId),
    runQuoteRecoveryAgent(businessId),
    runInvoiceRecoveryAgent(businessId),
    runCustomerReactivationAgent(businessId),
    runProfitRadarAgent(businessId),
  ]);
  const candidates = results.flat();

  const existing = await prisma.aIAction.findMany({
    where: { businessId },
    select: { id: true, type: true, entityType: true, entityId: true, status: true },
  });
  const existingKey = new Set(existing.map((a) => key(a.type, a.entityType, a.entityId)));
  const pendingById = new Map(
    existing.filter((a) => a.status === "PENDING").map((a) => [key(a.type, a.entityType, a.entityId), a.id])
  );

  let created = 0;
  let updated = 0;

  for (const c of candidates) {
    const k = key(c.type, c.entityType, c.entityId);
    const pendingId = pendingById.get(k);
    if (pendingId) {
      await prisma.aIAction.update({
        where: { id: pendingId },
        data: {
          title: c.title,
          description: c.description,
          estimatedValue: c.estimatedValue,
          priority: c.priority,
          aiReasoningSummary: c.aiReasoningSummary,
          suggestedMessage: c.suggestedMessage,
        },
      });
      updated++;
      continue;
    }
    if (existingKey.has(k)) continue; // already resolved/dismissed once — don't resurrect

    await prisma.aIAction.create({ data: toCreateInput(businessId, c) });
    created++;
  }

  return { created, updated, scanned: candidates.length };
}

function key(type: string, entityType: string, entityId: string) {
  return `${type}::${entityType}::${entityId}`;
}

function toCreateInput(businessId: string, c: ActionCandidate) {
  return {
    businessId,
    type: c.type,
    entityType: c.entityType,
    entityId: c.entityId,
    title: c.title,
    description: c.description,
    estimatedValue: c.estimatedValue,
    priority: c.priority,
    aiReasoningSummary: c.aiReasoningSummary,
    suggestedMessage: c.suggestedMessage,
    customerId: c.customerId ?? undefined,
    leadId: c.leadId ?? undefined,
    quoteId: c.quoteId ?? undefined,
    invoiceId: c.invoiceId ?? undefined,
    jobId: c.jobId ?? undefined,
  };
}
