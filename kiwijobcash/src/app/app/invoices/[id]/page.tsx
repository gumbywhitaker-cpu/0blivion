import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { InvoiceDetailClient } from "@/components/app/invoices/InvoiceDetailClient";

export default async function InvoiceDetailPage(ctx: PageProps<"/app/invoices/[id]">) {
  const { id } = await ctx.params;
  const { business } = await requireBusiness();

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: business.id },
    include: { customer: true, payments: { orderBy: { paymentDate: "desc" } } },
  });
  if (!invoice) notFound();

  const relatedAction = await prisma.aIAction.findFirst({
    where: { businessId: business.id, invoiceId: invoice.id, status: "PENDING" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <InvoiceDetailClient invoice={invoice} relatedAction={relatedAction} />
    </div>
  );
}
