"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";

const orchardSchema = z.object({
  name: z.string().trim().min(2).max(200),
  region: z.string().trim().max(200).optional(),
  address: z.string().trim().max(300).optional(),
  hectares: z.string().trim().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type FormState = { error?: string } | undefined;

export async function createOrchardAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.orgType !== "GROWER") {
    return { error: "Only grower organisations manage orchards" };
  }
  assertCanManage(session.role);

  const parsed = orchardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, region, address, hectares, notes } = parsed.data;
  const hectaresValue = hectares ? Number.parseFloat(hectares) : NaN;

  const orchard = await prisma.orchard.create({
    data: {
      organizationId: session.organizationId,
      name,
      region: region || null,
      address: address || null,
      hectares: Number.isFinite(hectaresValue) ? hectaresValue : null,
      notes: notes || null,
    },
  });

  redirect(`/orchards/${orchard.id}`);
}
