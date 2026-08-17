export type PlanId = "FREE" | "SOLO" | "PRO" | "CREW";

export type Plan = {
  id: PlanId;
  name: string;
  priceMonthlyNzd: number;
  tagline: string;
  features: string[];
  aiActionsPerMonth: number;
  customerLimit: number | null;
  userLimit: number;
  stripePriceEnvVar?: string;
  highlight?: boolean;
};

/**
 * Central pricing configuration. Nothing in the UI hard-codes a price —
 * every screen (marketing pricing page, billing settings, usage banners)
 * reads from this file so prices only ever change in one place.
 */
export const PLANS: Plan[] = [
  {
    id: "FREE",
    name: "Free",
    priceMonthlyNzd: 0,
    tagline: "Try it out, no card required.",
    aiActionsPerMonth: 10,
    customerLimit: 15,
    userLimit: 1,
    features: [
      "Basic dashboard",
      "Up to 15 customers",
      "10 AI actions / month",
      "Free Money Leak Scan",
      "Demo mode",
    ],
  },
  {
    id: "SOLO",
    name: "Solo",
    priceMonthlyNzd: 29,
    tagline: "For the one-person operation.",
    aiActionsPerMonth: 100,
    customerLimit: null,
    userLimit: 1,
    stripePriceEnvVar: "STRIPE_PRICE_SOLO",
    highlight: true,
    features: [
      "Unlimited customers, leads, quotes, invoices",
      "100 AI actions / month",
      "Daily business report",
      "Customer reactivation",
      "Revenue dashboard",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    priceMonthlyNzd: 59,
    tagline: "For growing businesses that want more.",
    aiActionsPerMonth: 500,
    customerLimit: null,
    userLimit: 3,
    stripePriceEnvVar: "STRIPE_PRICE_PRO",
    features: [
      "Everything in Solo",
      "Advanced AI & Profit Radar",
      "Integrations (Xero, Gmail, Twilio, Zapier)",
      "Automation controls",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    id: "CREW",
    name: "Crew",
    priceMonthlyNzd: 99,
    tagline: "For teams with multiple staff.",
    aiActionsPerMonth: 1500,
    customerLimit: null,
    userLimit: 10,
    stripePriceEnvVar: "STRIPE_PRICE_CREW",
    features: [
      "Everything in Pro",
      "Multiple users & role permissions",
      "Team dashboard",
      "Advanced reporting",
      "Higher usage limits",
    ],
  },
];

export function getPlan(id: string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
