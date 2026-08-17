import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse, ApiError } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

const KNOWN_PROVIDERS = ["XERO", "GOOGLE", "TWILIO", "ZAPIER"];

export async function POST(_req: Request, ctx: RouteContext<"/api/integrations/[provider]/disconnect">) {
  try {
    const { provider } = await ctx.params;
    const providerUpper = provider.toUpperCase();
    if (!KNOWN_PROVIDERS.includes(providerUpper)) {
      throw new ApiError(400, "Unknown integration.");
    }

    const { business, membership } = await requireApiBusiness("integrations:manage");

    await prisma.integration.updateMany({
      where: { businessId: business.id, provider: providerUpper },
      data: { status: "NOT_CONNECTED", metadata: null, externalAccountId: null },
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "integration.disconnected",
      entityType: "Integration",
      metadata: { provider: providerUpper },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
