import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { trackEvent } from "@/lib/events";

const rowSchema = z.object({
  name: z.string().trim().min(1).max(160),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

const schema = z.object({
  rows: z.array(rowSchema).min(1, "No rows to import.").max(2000, "Import up to 2000 rows at a time."),
});

export async function POST(req: Request) {
  try {
    const { business, membership } = await requireApiBusiness("records:create");
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid import data." },
        { status: 400 }
      );
    }

    const validRows = parsed.data.rows.filter((r) => r.name.trim().length > 0);
    if (validRows.length === 0) {
      return NextResponse.json({ error: "Every row needs at least a name." }, { status: 400 });
    }

    const result = await prisma.customer.createMany({
      data: validRows.map((r) => ({
        businessId: business.id,
        name: r.name,
        companyName: r.companyName || null,
        email: r.email || null,
        phone: r.phone || null,
        address: r.address || null,
        city: r.city || null,
        notes: r.notes || null,
      })),
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "customers.import",
      entityType: "Customer",
      metadata: { count: result.count },
    });
    await trackEvent("customers_imported", {
      businessId: business.id,
      userId: membership.userId,
      properties: { count: result.count },
    });

    return NextResponse.json({ imported: result.count });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
