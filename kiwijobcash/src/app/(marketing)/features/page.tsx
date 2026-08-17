import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import {
  Zap,
  Users,
  FileText,
  Receipt,
  Briefcase,
  Wallet,
  Bot,
  BarChart3,
  Plug,
  Shield,
  Smartphone,
  Bell,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features",
  description: "Everything Kiwi Job Cash includes: action centre, quote and invoice recovery, Ask Kiwi, Profit Radar, integrations and more.",
};

const FEATURES = [
  { icon: Zap, title: "Action Centre", body: "Every recoverable dollar, ranked and ready to action — highest value or most urgent first." },
  { icon: Users, title: "Lead management", body: "Pipeline and list views, AI follow-up drafting, and automatic stale-lead detection." },
  { icon: FileText, title: "Quote recovery", body: "Hot, warm and cold buckets with conversion tracking and one-click follow-ups." },
  { icon: Receipt, title: "Invoice recovery", body: "Ageing buckets, friendly/firm/final reminders, and payment tracking." },
  { icon: Briefcase, title: "Job & profit tracking", body: "Track cost and revenue per job, feeding straight into Profit Radar." },
  { icon: Wallet, title: "Money page", body: "One screen for money at risk, money recovered, and your recovery history." },
  { icon: Bot, title: "Ask Kiwi", body: "Ask plain-English questions and get answers grounded in your real business data." },
  { icon: BarChart3, title: "Profit Radar", body: "Revenue, cost and margin trends — clearly labelled reported, estimated or projected." },
  { icon: Plug, title: "Integrations", body: "CSV import today; Xero, Gmail, Twilio and Google Calendar as you grow." },
  { icon: Bell, title: "Daily report", body: "A short morning summary of what's at risk and what to do about it." },
  { icon: Smartphone, title: "Mobile-first", body: "Everything works from your phone — bottom nav, one-tap create, fast forms." },
  { icon: Shield, title: "Built for NZ small business", body: "NZD, Pacific/Auckland time, DD/MM/YYYY dates, and tenant-isolated data." },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Everything you need to stop leaking money</h1>
        <p className="mt-3 text-muted">One tool, built specifically for the way trade and service businesses work.</p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
              <f.icon className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Button href="/money-leak-scan" size="lg">
          Find my lost money
        </Button>
      </div>
    </div>
  );
}
