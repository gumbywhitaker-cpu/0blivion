import "server-only";
import { prisma } from "@/lib/db";

/**
 * Product analytics event tracking. Deliberately minimal — a row per event,
 * no PII beyond what's already in businessId/userId. See section 39 of the
 * product spec for the canonical event name list.
 */
export async function trackEvent(
  name: string,
  params: {
    businessId?: string | null;
    userId?: string | null;
    properties?: Record<string, unknown>;
  } = {}
) {
  try {
    await prisma.event.create({
      data: {
        name,
        businessId: params.businessId ?? null,
        userId: params.userId ?? null,
        properties: params.properties ? JSON.stringify(params.properties) : undefined,
      },
    });
  } catch (err) {
    console.error("Failed to track event:", err);
  }
}
