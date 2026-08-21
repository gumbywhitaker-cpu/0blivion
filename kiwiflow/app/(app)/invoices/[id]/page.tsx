import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { InvoiceStatusBadge } from "@/lib/ui/badges";
import { sendInvoiceAction, markPaidAction } from "../actions";
import { PrintButton } from "./PrintButton";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      OR: [{ fromOrgId: session.organizationId }, { toOrgId: session.organizationId }],
    },
    include: { fromOrg: true, toOrg: true, items: true },
  });
  if (!invoice) notFound();

  const isIssuer = invoice.fromOrgId === session.organizationId;
  // IRD's taxable supply information rules: a GST number is required on any invoice
  // over $200 for it to count as valid GST records (docs/BLUEPRINT.md Section 20).
  const missingGstNumber = invoice.total > 200 && !invoice.fromOrg.gstNumber;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 print:max-w-none">
      {isIssuer && missingGstNumber ? (
        <p className="rounded-lg bg-kf-gold/15 px-4 py-3 text-sm text-kf-gold print:hidden">
          {invoice.fromOrg.name} has no GST number on file. Add one in{" "}
          <a href="/settings" className="underline">
            Settings
          </a>{" "}
          — invoices over $200 need it to count as valid GST records under IRD rules.
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-kf-muted">Tax Invoice</p>
          <h1 className="text-2xl font-semibold text-kf-charcoal">{invoice.invoiceNumber}</h1>
          <p className="text-kf-muted">
            Issued {invoice.issuedAt ? invoice.issuedAt.toISOString().slice(0, 10) : "not yet sent"}
            {invoice.dueDate ? ` · Due ${invoice.dueDate.toISOString().slice(0, 10)}` : ""}
          </p>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-kf-border bg-kf-card p-4">
        <div>
          <p className="text-xs uppercase text-kf-muted">From</p>
          <p className="font-medium text-kf-charcoal">{invoice.fromOrg.name}</p>
          {invoice.fromOrg.gstNumber ? (
            <p className="text-sm text-kf-charcoal">GST {invoice.fromOrg.gstNumber}</p>
          ) : null}
          {invoice.fromOrg.address ? <p className="text-sm text-kf-muted">{invoice.fromOrg.address}</p> : null}
        </div>
        <div>
          <p className="text-xs uppercase text-kf-muted">To</p>
          <p className="font-medium text-kf-charcoal">{invoice.toOrg.name}</p>
          {invoice.toOrg.address ? <p className="text-sm text-kf-muted">{invoice.toOrg.address}</p> : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
            <tr>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-kf-border last:border-0">
                <td className="px-4 py-3">{item.description}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">${item.rate.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="text-sm">
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right text-kf-muted">
                Subtotal
              </td>
              <td className="px-4 py-2 text-right">${invoice.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right text-kf-muted">
                GST ({(invoice.gstRate * 100).toFixed(0)}%)
              </td>
              <td className="px-4 py-2 text-right">${invoice.gstAmount.toFixed(2)}</td>
            </tr>
            <tr className="border-t border-kf-border font-semibold text-kf-charcoal">
              <td colSpan={3} className="px-4 py-3 text-right">
                Total
              </td>
              <td className="px-4 py-3 text-right">${invoice.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap gap-3 print:hidden">
        <PrintButton />
        {isIssuer && invoice.status === "DRAFT" ? (
          <form action={sendInvoiceAction}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <button
              type="submit"
              className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700"
            >
              Send invoice
            </button>
          </form>
        ) : null}
        {isIssuer && (invoice.status === "SENT" || invoice.status === "OVERDUE") ? (
          <form action={markPaidAction}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <button
              type="submit"
              className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700"
            >
              Mark as paid
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
