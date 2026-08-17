import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({
  webhookUrl: z.string().trim().url("Enter a valid webhook URL."),
});

export async function PATCH(req: Request) {
  try {
    const { business, membership } = await requireApiBusiness("integrations:manage");
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    let pingOk = true;
    try {
      const res = await fetch(parsed.data.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "kiwi_job_cash.connected", businessName: business.name }),
      });
      pingOk = res.ok;
    } catch {
      pingOk = false;
    }

    await prisma.integration.upsert({
      where: { businessId_provider: { businessId: business.id, provider: "ZAPIER" } },
      update: {
        status: pingOk ? "CONNECTED" : "ERROR",
        metadata: JSON.stringify({ webhookUrl: parsed.data.webhookUrl }),
        lastSyncAt: new Date(),
      },
      create: {
        businessId: business.id,
        provider: "ZAPIER",
        status: pingOk ? "CONNECTED" : "ERROR",
        metadata: JSON.stringify({ webhookUrl: parsed.data.webhookUrl }),
        lastSyncAt: new Date(),
      },
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "integration.connected",
      entityType: "Integration",
      metadata: { provider: "ZAPIER" },
    });

    if (!pingOk) {
      return NextResponse.json(
        { error: "Saved, but we couldn't reach that webhook URL. Check it in Zapier and try again.", saved: true },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
