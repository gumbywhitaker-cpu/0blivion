import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PLANS } from "@/lib/plans";
import { PricingGrid } from "@/components/marketing/PricingGrid";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for Kiwi Job Cash. Start free, upgrade when it pays for itself.",
};

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from Settings → Billing whenever you like — no phone calls, no forms.",
  },
  {
    q: "What happens on the Free plan?",
    a: "You get the dashboard, up to 15 customers, 10 AI actions a month, the Money Leak Scan and demo mode — no card required.",
  },
  {
    q: "What counts as an AI action?",
    a: "Each follow-up message, reminder or recommendation Kiwi Job Cash prepares and you send counts as one AI action.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Simple pricing</h1>
        <p className="mt-3 text-muted">
          Start free. Upgrade when Kiwi Job Cash starts paying for itself.
        </p>
      </div>

      <PricingGrid plans={PLANS} className="mt-12" />

      <div className="mx-auto mt-20 max-w-2xl">
        <h2 className="text-center text-2xl font-semibold text-foreground">Pricing questions</h2>
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-surface">
          {FAQS.map((f) => (
            <div key={f.q} className="p-5">
              <p className="font-medium text-foreground">{f.q}</p>
              <p className="mt-1.5 text-sm text-muted">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button href="/faq" variant="outline">
            More questions? Read the FAQ
          </Button>
        </div>
      </div>

      <p className="mt-12 text-center text-sm text-muted">
        All prices in NZD, excluding GST. Need a custom plan for a larger team?{" "}
        <Link href="/contact" className="text-brand hover:underline">
          Get in touch
        </Link>
        .
      </p>
    </div>
  );
}
