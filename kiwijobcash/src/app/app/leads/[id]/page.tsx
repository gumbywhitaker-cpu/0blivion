import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { LeadDetailClient } from "@/components/app/leads/LeadDetailClient";

export default async function LeadDetailPage(ctx: PageProps<"/app/leads/[id]">) {
  const { id } = await ctx.params;
  const { business } = await requireBusiness();

  const lead = await prisma.lead.findFirst({
    where: { id, businessId: business.id },
    include: { customer: true, quotes: true },
  });
  if (!lead) notFound();

  const relatedAction = await prisma.aIAction.findFirst({
    where: { businessId: business.id, leadId: lead.id, status: "PENDING" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <LeadDetailClient
        lead={{
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          description: lead.description,
          estimatedValue: lead.estimatedValue,
          status: lead.status,
          priority: lead.priority,
          createdAt: lead.createdAt,
          lastContactedAt: lead.lastContactedAt,
          nextFollowupAt: lead.nextFollowupAt,
          customer: lead.customer,
          quoteCount: lead.quotes.length,
        }}
        relatedAction={relatedAction}
      />
    </div>
  );
}
