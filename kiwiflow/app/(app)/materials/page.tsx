import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { MaterialOrderStatusBadge } from "@/lib/ui/badges";

export default async function MaterialsPage() {
  const session = await requireSession();

  const orders = await prisma.materialOrder.findMany({
    where: { organizationId: session.organizationId },
    include: { supplier: true, orchard: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-kf-charcoal">Materials ordering</h1>
        <div className="flex gap-2">
          <a
            href="/api/v1/export/material-orders.csv"
            className="btn rounded-md border border-kf-border px-4 py-2 text-sm font-medium text-kf-charcoal hover:border-kf-green-500"
          >
            Export CSV
          </a>
          <Link
            href="/materials/suppliers"
            className="btn rounded-md border border-kf-border px-4 py-2 text-sm font-medium text-kf-charcoal hover:border-kf-green-500"
          >
            Suppliers
          </Link>
          <Link
            href="/materials/new"
            className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700"
          >
            + New order
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
          No material orders yet. Add a supplier first, then place an order.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Orchard</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-kf-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/materials/${order.id}`} className="font-medium text-kf-green-600 hover:underline">
                      {order.createdAt.toISOString().slice(0, 10)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.supplier.name}</td>
                  <td className="px-4 py-3">{order.orchard?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    ${order.subtotal.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <MaterialOrderStatusBadge status={order.status} />
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
