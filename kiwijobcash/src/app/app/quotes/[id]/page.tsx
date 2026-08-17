import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { QuoteDetailClient } from "@/components/app/quotes/QuoteDetailClient";

export default async function QuoteDetailPage(ctx: PageProps<"/app/quotes/[id]">) {
  const { id } = await ctx.params;
  const { business } = await requireBusiness();

  const quote = await prisma.quote.findFirst({
    where: { id, businessId: business.id },
    include: { customer: true },
  });
  if (!quote) notFound();

  const relatedAction = await prisma.aIAction.findFirst({
    where: { businessId: business.id, quoteId: quote.id, status: "PENDING" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <QuoteDetailClient quote={quote} relatedAction={relatedAction} />
    </div>
  );
}
