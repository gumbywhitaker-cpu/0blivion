import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { NotificationsListClient } from "@/components/app/NotificationsListClient";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { business } = await requireBusiness();
  const notifications = await prisma.notification.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
      <NotificationsListClient
        notifications={notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          priority: n.priority,
          read: n.read,
          actionUrl: n.actionUrl,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
