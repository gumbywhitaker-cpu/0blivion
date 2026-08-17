import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { getIntegrationDefs } from "@/lib/integrations";

export async function GET() {
  try {
    const { business } = await requireApiBusiness();
    const rows = await prisma.integration.findMany({ where: { businessId: business.id } });
    const byProvider = new Map(rows.map((r) => [r.provider, r]));

    const integrations = getIntegrationDefs().map((def) => {
      const row = byProvider.get(def.provider);
      return {
        ...def,
        status: row?.status ?? "NOT_CONNECTED",
        externalAccountId: row?.externalAccountId ?? null,
        lastSyncAt: row?.lastSyncAt?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ integrations });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
