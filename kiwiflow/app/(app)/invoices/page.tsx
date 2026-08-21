import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { InvoiceStatusBadge } from "@/lib/ui/badges";

export default async function InvoicesPage() {
  const session = await requireSession();

  const invoices = await prisma.invoice.findMany({
    where: { OR: [{ fromOrgId: session.organizationId }, { toOrgId: session.organizationId }] },
    include: { fromOrg: true, toOrg: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-kf-charcoal">Invoices</h1>
        <a
          href="/api/v1/export/invoices.csv"
          className="btn rounded-md border border-kf-border px-4 py-2 text-sm font-medium text-kf-charcoal hover:border-kf-green-500"
        >
          Export CSV
        </a>
      </div>

      {invoices.length === 0 ? (
        <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
          No invoices yet. They&apos;re drafted automatically when a job is marked complete.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-kf-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-kf-green-600 hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{inv.fromOrg.name}</td>
                  <td className="px-4 py-3">{inv.toOrg.name}</td>
                  <td className="px-4 py-3">${inv.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
