import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { getStripeClient, priceIdForPlan } from "@/lib/stripe";
import { getPlan } from "@/lib/plans";
import { writeAuditLog } from "@/lib/audit";

const schema = z.object({
  plan: z.enum(["SOLO", "PRO", "CREW"]),
});

export async function POST(req: Request) {
  try {
    const { user, business, membership } = await requireApiBusiness("billing:manage");

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: "Billing isn't configured for this environment yet." },
        { status: 501 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a plan to upgrade to." }, { status: 400 });
    }

    const plan = getPlan(parsed.data.plan);
    const priceId = priceIdForPlan(plan.stripePriceEnvVar);
    if (!priceId) {
      return NextResponse.json(
        { error: `The ${plan.name} plan isn't priced in this environment yet.` },
        { status: 501 }
      );
    }

    const subscription = await prisma.subscription.findUnique({ where: { businessId: business.id } });

    let customerId = subscription?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: business.name,
        metadata: { businessId: business.id },
      });
      customerId = customer.id;
      await prisma.subscription.upsert({
        where: { businessId: business.id },
        update: { stripeCustomerId: customerId },
        create: { businessId: business.id, stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app/settings/billing?checkout=success`,
      cancel_url: `${appUrl}/app/settings/billing?checkout=cancelled`,
      client_reference_id: business.id,
      subscription_data: { metadata: { businessId: business.id, plan: plan.id } },
      metadata: { businessId: business.id, plan: plan.id },
      allow_promotion_codes: true,
    });

    await writeAuditLog({
      businessId: business.id,
      userId: membership.userId,
      action: "billing.checkout_started",
      entityType: "Subscription",
      entityId: business.id,
      metadata: { plan: plan.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
