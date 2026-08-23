"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { assertCanManage } from "@/lib/auth/requireRole";

export type FormState = { error?: string; success?: boolean } | undefined;

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(200),
  gstNumber: z.string().trim().max(20).optional(),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(30).optional(),
});

export async function updateOrgSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  assertCanManage(session.role);

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, gstNumber, address, phone } = parsed.data;

  await prisma.organization.update({
    where: { id: session.organizationId },
    data: {
      name,
      gstNumber: gstNumber || null,
      address: address || null,
      phone: phone || null,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}
