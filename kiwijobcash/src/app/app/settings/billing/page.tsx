import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getPlan, PLANS } from "@/lib/plans";
import { getUsage } from "@/lib/usage";
import { stripeConfigured, priceIdForPlan } from "@/lib/stripe";
import { hasPermission, type Role } from "@/lib/permissions";
import { BillingClient } from "@/components/app/settings/BillingClient";

export default async function BillingSettingsPage() {
  const { business, membership } = await requireBusiness();
  const canManage = hasPermission(membership.role as Role, "billing:manage");

  const [subscription, { usage }] = await Promise.all([
    prisma.subscription.findUnique({ where: { businessId: business.id } }),
    getUsage(business.id),
  ]);

  const plan = getPlan(subscription?.plan);
  const plansWithPricing = PLANS.map((p) => ({
    ...p,
    priced: p.priceMonthlyNzd === 0 || Boolean(priceIdForPlan(p.stripePriceEnvVar)),
  }));

  return (
    <BillingClient
      canManage={canManage}
      currentPlanId={plan.id}
      status={subscription?.status ?? "ACTIVE"}
      cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd ?? false}
      currentPeriodEnd={subscription?.currentPeriodEnd?.toISOString() ?? null}
      hasStripeCustomer={Boolean(subscription?.stripeCustomerId)}
      stripeConfigured={stripeConfigured()}
      plans={plansWithPricing}
      usage={{
        aiActions: usage.aiActions,
        aiActionsLimit: plan.aiActionsPerMonth,
      }}
    />
  );
}
