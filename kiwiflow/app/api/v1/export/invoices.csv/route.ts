import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

// GET /api/v1/export/invoices.csv — accountant-readable column headers, org-scoped.
export async function GET() {
  const session = await requireSession();

  const invoices = await prisma.invoice.findMany({
    where: { OR: [{ fromOrgId: session.organizationId }, { toOrgId: session.organizationId }] },
    include: { fromOrg: true, toOrg: true },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    [
      "Invoice Number",
      "From",
      "To",
      "Status",
      "Subtotal",
      "GST",
      "Total",
      "Issued",
      "Due",
      "Paid",
    ],
    invoices.map((inv) => [
      inv.invoiceNumber,
      inv.fromOrg.name,
      inv.toOrg.name,
      inv.status,
      inv.subtotal.toFixed(2),
      inv.gstAmount.toFixed(2),
      inv.total.toFixed(2),
      inv.issuedAt ? inv.issuedAt.toISOString().slice(0, 10) : "",
      inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : "",
      inv.paidAt ? inv.paidAt.toISOString().slice(0, 10) : "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kiwiflow-invoices-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
