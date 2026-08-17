import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { trackEvent } from "@/lib/events";

function planIdForPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  const plan = PLANS.find(
    (p) => p.stripePriceEnvVar && process.env[p.stripePriceEnvVar] === priceId
  );
  return plan?.id ?? null;
}

async function syncSubscriptionFromStripe(sub: Stripe.Subscription, businessIdHint?: string) {
  const businessId = businessIdHint ?? sub.metadata?.businessId;
  if (!businessId) return;

  const priceId = sub.items.data[0]?.price?.id ?? null;
  const planId = planIdForPriceId(priceId) ?? (sub.metadata?.plan as PlanId | undefined) ?? undefined;
  const item = sub.items.data[0];

  await prisma.subscription.upsert({
    where: { businessId },
    update: {
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripeSubscriptionId: sub.id,
      ...(planId ? { plan: planId } : {}),
      status: sub.status.toUpperCase(),
      currentPeriodStart: item?.current_period_start
        ? new Date(item.current_period_start * 1000)
        : undefined,
      currentPeriodEnd: item?.current_period_end
        ? new Date(item.current_period_end * 1000)
        : undefined,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    create: {
      businessId,
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripeSubscriptionId: sub.id,
      plan: planId ?? "FREE",
      status: sub.status.toUpperCase(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}

export async function POST(req: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhooks not configured." }, { status: 501 });
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing signature");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const businessId = session.metadata?.businessId ?? session.client_reference_id ?? undefined;
      if (businessId && session.subscription) {
        const subId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscriptionFromStripe(sub, businessId);
        await trackEvent("subscription_started", {
          businessId,
          properties: { plan: session.metadata?.plan },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscriptionFromStripe(sub);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const businessId = sub.metadata?.businessId;
      if (businessId) {
        await prisma.subscription.updateMany({
          where: { businessId },
          data: { plan: "FREE", status: "CANCELED", cancelAtPeriodEnd: false },
        });
        await trackEvent("subscription_canceled", { businessId });
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: { status: "PAST_DUE" },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
