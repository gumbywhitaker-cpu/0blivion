import { Suspense } from "react";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { LeadsListClient } from "@/components/app/leads/LeadsListClient";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  const { business } = await requireBusiness();

  const [leads, customers] = await Promise.all([
    prisma.lead.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" } }),
    prisma.customer.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true, companyName: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
        <p className="mt-1 text-muted">{leads.length} total</p>
      </div>
      <Suspense fallback={null}>
        <LeadsListClient
          leads={leads.map((l) => ({
            id: l.id,
            name: l.name,
            status: l.status,
            priority: l.priority,
            estimatedValue: l.estimatedValue,
            source: l.source,
            createdAt: l.createdAt.toISOString(),
          }))}
          customers={customers}
        />
      </Suspense>
    </div>
  );
}
