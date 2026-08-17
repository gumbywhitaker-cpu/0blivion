import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiBusiness, apiErrorResponse } from "@/lib/api-auth";
import { getStripeClient } from "@/lib/stripe";

export async function POST() {
  try {
    const { business } = await requireApiBusiness("billing:manage");

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: "Billing isn't configured for this environment yet." },
        { status: 501 }
      );
    }

    const subscription = await prisma.subscription.findUnique({ where: { businessId: business.id } });
    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Upgrade to a paid plan first to manage billing." },
        { status: 400 }
      );
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/app/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
