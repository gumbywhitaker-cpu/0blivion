import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { verifyTwilioCredentials } from "@/lib/sms";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({
  accountSid: z.string().trim().min(1, "Enter your Twilio Account SID."),
  authToken: z.string().trim().min(1, "Enter your Twilio Auth Token."),
  fromNumber: z.string().trim().min(1, "Enter your Twilio phone number."),
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

    const valid = await verifyTwilioCredentials(parsed.data.accountSid, parsed.data.authToken);
    if (!valid) {
      await prisma.integration.upsert({
        where: { businessId_provider: { businessId: business.id, provider: "TWILIO" } },
        update: { status: "ERROR" },
        create: { businessId: business.id, provider: "TWILIO", status: "ERROR" },
      });
      return NextResponse.json(
        { error: "Those Twilio credentials don't look right. Double-check your Account SID and Auth Token." },
        { status: 400 }
      );
    }

    await prisma.integration.upsert({
      where: { businessId_provider: { businessId: business.id, provider: "TWILIO" } },
      update: {
        status: "CONNECTED",
        externalAccountId: parsed.data.accountSid,
        metadata: JSON.stringify(parsed.data),
        lastSyncAt: new Date(),
      },
      create: {
        businessId: business.id,
        provider: "TWILIO",
        status: "CONNECTED",
        externalAccountId: parsed.data.accountSid,
        metadata: JSON.stringify(parsed.data),
        lastSyncAt: new Date(),
      },
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "integration.connected",
      entityType: "Integration",
      metadata: { provider: "TWILIO" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
