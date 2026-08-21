import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { MaterialOrderStatusBadge } from "@/lib/ui/badges";
import { MaterialOrderActions } from "./MaterialOrderActions";
import type { MaterialOrderStatus } from "@/lib/types";

export default async function MaterialOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const order = await prisma.materialOrder.findFirst({
    where: { id, organizationId: session.organizationId },
    include: { supplier: true, orchard: true, createdBy: true, items: true },
  });
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-kf-charcoal">
            Order from {order.supplier.name}
          </h1>
          <p className="text-kf-muted">
            {order.createdAt.toISOString().slice(0, 10)} · placed by {order.createdBy.name}
            {order.orchard ? ` · for ${order.orchard.name}` : ""}
          </p>
        </div>
        <MaterialOrderStatusBadge status={order.status} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
            <tr>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Unit price</th>
              <th className="px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-kf-border last:border-0">
                <td className="px-4 py-3">{item.description}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{item.unit}</td>
                <td className="px-4 py-3">${item.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-3">${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right font-semibold text-kf-charcoal">
                Subtotal
              </td>
              <td className="px-4 py-3 font-semibold text-kf-charcoal">${order.subtotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {order.notes ? (
        <div className="rounded-lg border border-kf-border bg-kf-card p-4">
          <p className="text-xs uppercase text-kf-muted">Notes</p>
          <p className="text-kf-charcoal">{order.notes}</p>
        </div>
      ) : null}

      {order.requestedDeliveryDate ? (
        <p className="text-sm text-kf-muted">
          Requested delivery: {order.requestedDeliveryDate.toISOString().slice(0, 10)}
        </p>
      ) : null}
      {order.deliveredAt ? (
        <p className="text-sm text-kf-green-700">
          Delivered {order.deliveredAt.toISOString().slice(0, 10)}
        </p>
      ) : null}

      <MaterialOrderActions orderId={order.id} status={order.status as MaterialOrderStatus} />
    </div>
  );
}
