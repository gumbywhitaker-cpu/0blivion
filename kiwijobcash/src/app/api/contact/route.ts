import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/events";

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().toLowerCase().email(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(4000),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please fill in every field." },
      { status: 400 }
    );
  }

  const support = await prisma.supportRequest.create({
    data: {
      subject: parsed.data.subject,
      message: `From: ${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
    },
  });

  await trackEvent("contact_form_submitted", { properties: { supportRequestId: support.id } });

  return NextResponse.json({ ok: true });
}
