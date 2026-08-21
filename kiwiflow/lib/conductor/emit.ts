import { prisma } from "@/lib/db";
import { ACTIONS } from "@/lib/conductor/actions";
import type { ConductorEvent } from "@/lib/conductor/events";

/**
 * emitEvent runs the Conductor in-process and synchronously: the event row is
 * written, matching WorkflowRules are loaded, and their actions run before this
 * function returns. See docs/BLUEPRINT.md Section 1 for why this is the right
 * simplification for the MVP's event volume, and what would trigger moving to a
 * queue (the `processedAt` column is exactly what a future worker would poll on).
 */
export async function emitEvent(organizationId: string, event: ConductorEvent): Promise<void> {
  const row = await prisma.event.create({
    data: {
      organizationId,
      type: event.type,
      payload: JSON.stringify(event.payload),
    },
  });

  const rules = await prisma.workflowRule.findMany({
    where: {
      eventType: event.type,
      enabled: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });

  for (const rule of rules) {
    let actions: { action: string; params?: Record<string, unknown> }[] = [];
    try {
      actions = JSON.parse(rule.actions);
    } catch {
      console.error(`[conductor] rule ${rule.id} has invalid actions JSON`);
      continue;
    }
    for (const step of actions) {
      const fn = ACTIONS[step.action];
      if (!fn) {
        console.warn(`[conductor] rule ${rule.id} references unknown action "${step.action}"`);
        continue;
      }
      try {
        await fn({ organizationId, event }, step.params ?? {});
      } catch (err) {
        console.error(`[conductor] action "${step.action}" failed for rule ${rule.id}:`, err);
      }
    }
  }

  await prisma.event.update({ where: { id: row.id }, data: { processedAt: new Date() } });
}
