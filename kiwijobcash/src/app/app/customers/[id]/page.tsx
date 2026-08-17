import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatMoney, formatDate } from "@/lib/format";
import { CustomerDetailClient } from "@/components/app/customers/CustomerDetailClient";

export default async function CustomerDetailPage(ctx: PageProps<"/app/customers/[id]">) {
  const { id } = await ctx.params;
  const { business } = await requireBusiness();

  const customer = await prisma.customer.findFirst({
    where: { id, businessId: business.id },
    include: {
      leads: { orderBy: { createdAt: "desc" } },
      quotes: { orderBy: { createdAt: "desc" } },
      invoices: { include: { payments: true }, orderBy: { createdAt: "desc" } },
      jobs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) notFound();

  const aiActions = await prisma.aIAction.findMany({
    where: { businessId: business.id, customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{customer.name}</h1>
              <StatusBadge status={customer.customerStatus} />
            </div>
            {customer.companyName && <p className="mt-0.5 text-muted">{customer.companyName}</p>}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              {customer.email && <span>{customer.email}</span>}
              {customer.phone && <span>{customer.phone}</span>}
              {customer.city && <span>{customer.city}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase text-muted">Lifetime value</p>
            <p className="text-2xl font-semibold tabular-nums text-money">
              {formatMoney(customer.lifetimeValue)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-4 text-sm">
          <div>
            <p className="text-muted">Total jobs</p>
            <p className="mt-0.5 font-medium">{customer.totalJobs}</p>
          </div>
          <div>
            <p className="text-muted">Last job</p>
            <p className="mt-0.5 font-medium">{formatDate(customer.lastJobDate)}</p>
          </div>
          <div>
            <p className="text-muted">Last contact</p>
            <p className="mt-0.5 font-medium">{formatDate(customer.lastContactDate)}</p>
          </div>
        </div>

        {customer.notes && (
          <p className="mt-4 rounded-lg bg-surface-2 p-3 text-sm text-muted">{customer.notes}</p>
        )}
      </Card>

      <CustomerDetailClient
        customer={{ id: customer.id, customerStatus: customer.customerStatus, notes: customer.notes }}
        leads={customer.leads}
        quotes={customer.quotes}
        invoices={customer.invoices.map((i) => ({
          ...i,
          balance: Math.max(0, i.amount - i.payments.reduce((s, p) => s + p.amount, 0)),
        }))}
        jobs={customer.jobs}
        aiActions={aiActions}
      />
    </div>
  );
}
