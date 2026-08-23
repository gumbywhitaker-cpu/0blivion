"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function markReadAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const notificationId = String(formData.get("notificationId"));

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.userId },
    data: { read: true },
  });
  revalidatePath("/notifications");
}

export async function markAllReadAction(): Promise<void> {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { userId: session.userId, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
}
