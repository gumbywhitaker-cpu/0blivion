import { prisma } from "@/lib/db";
import { SupportListClient } from "@/components/admin/SupportListClient";

export const metadata = { title: "Support — Admin" };

export default async function AdminSupportPage() {
  const requests = await prisma.supportRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { business: { select: { name: true } }, user: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Support requests</h1>
        <p className="mt-1 text-muted">From the contact form and in-app support.</p>
      </div>
      <SupportListClient
        requests={requests.map((r) => ({
          id: r.id,
          subject: r.subject,
          message: r.message,
          priority: r.priority,
          status: r.status,
          businessName: r.business?.name ?? null,
          userEmail: r.user?.email ?? null,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
