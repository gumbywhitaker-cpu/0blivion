// Rough, clearly-labelled estimate used only during onboarding, before any
// real business records exist. Once the business has real leads/quotes/
// invoices/customers, the dashboard switches to the real Money Engine
// (see src/lib/money-engine.ts) which is traceable to actual records.

export const REVENUE_BANDS = [
  { id: "UNDER_10K", label: "Under $10k / month", midpoint: 7500 },
  { id: "10K_25K", label: "$10k – $25k / month", midpoint: 17500 },
  { id: "25K_50K", label: "$25k – $50k / month", midpoint: 37500 },
  { id: "50K_100K", label: "$50k – $100k / month", midpoint: 75000 },
  { id: "OVER_100K", label: "Over $100k / month", midpoint: 125000 },
] as const;

export function estimateOnboardingOpportunity(input: {
  averageJobValue?: number | null;
  monthlyRevenueRange?: string | null;
}): number {
  const band = REVENUE_BANDS.find((b) => b.id === input.monthlyRevenueRange);
  if (input.averageJobValue && input.averageJobValue > 0) {
    // Roughly: a few unchased jobs' worth of value sitting in leads/quotes/invoices.
    const fromJobValue = input.averageJobValue * 2.8;
    const fromRevenue = band ? band.midpoint * 0.08 : fromJobValue;
    return Math.round((fromJobValue + fromRevenue) / 2 / 10) * 10;
  }
  if (band) return Math.round((band.midpoint * 0.08) / 10) * 10;
  return 1200; // conservative generic placeholder when we have no inputs at all
}
