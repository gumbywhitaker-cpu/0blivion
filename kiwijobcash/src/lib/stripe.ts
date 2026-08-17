import "server-only";
import Stripe from "stripe";

let client: Stripe | null | undefined;

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Returns a shared Stripe client, or null when STRIPE_SECRET_KEY isn't set. */
export function getStripeClient(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  client = key ? new Stripe(key) : null;
  return client;
}

export function priceIdForPlan(stripePriceEnvVar: string | undefined): string | null {
  if (!stripePriceEnvVar) return null;
  return process.env[stripePriceEnvVar] || null;
}
