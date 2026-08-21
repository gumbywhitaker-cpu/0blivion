import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

// GET /api/v1/export/material-orders.csv — accountant-readable column headers, org-scoped.
export async function GET() {
  const session = await requireSession();

  const orders = await prisma.materialOrder.findMany({
    where: { organizationId: session.organizationId },
    include: { supplier: true, orchard: true },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    ["Order ID", "Date", "Supplier", "Category", "Orchard", "Status", "Subtotal", "Requested Delivery", "Delivered"],
    orders.map((o) => [
      o.id,
      o.createdAt.toISOString().slice(0, 10),
      o.supplier.name,
      o.supplier.category,
      o.orchard?.name ?? "",
      o.status,
      o.subtotal,
      o.requestedDeliveryDate ? o.requestedDeliveryDate.toISOString().slice(0, 10) : "",
      o.deliveredAt ? o.deliveredAt.toISOString().slice(0, 10) : "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kiwiflow-material-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
