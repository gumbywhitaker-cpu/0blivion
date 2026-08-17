import {
  ArrowRight,
  Users,
  FileText,
  Receipt,
  UserCheck,
  Bot,
  Radar,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import { PricingGrid } from "@/components/marketing/PricingGrid";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="border-b border-border bg-gradient-to-b from-brand-light/60 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="brand">For New Zealand tradies &amp; small business</Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Find the money you&apos;re losing.
            </h1>
            <p className="mt-5 text-lg text-muted sm:text-xl">
              Kiwi Job Cash uses AI to find missed leads, forgotten quotes, overdue
              invoices and revenue opportunities — then helps you act on them.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/money-leak-scan" size="lg" icon={<ArrowRight className="size-4" />}>
                Find my lost money
              </Button>
              <Button href="/how-it-works" variant="outline" size="lg">
                See how it works
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted">
              Free 60-second scan. No card required.
            </p>
          </div>
        </div>
      </section>

      {/* MONEY LEAK DASHBOARD DEMO */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Your business could be leaking thousands.
            </h2>
            <p className="mt-4 text-muted">
              Every unanswered lead, forgotten quote and overdue invoice is money
              sitting on the table. Kiwi Job Cash puts a number on it, every single
              day.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Uncontacted leads going cold",
                "Quotes sent and never followed up",
                "Invoices sitting overdue",
                "Good customers who&apos;ve gone quiet",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-sm font-medium text-muted">Money at risk</p>
            <p className="mt-2 text-5xl font-semibold tracking-tight text-money tabular-nums">
              {formatMoney(8420)}
            </p>
            <p className="mt-1 text-sm text-muted">Estimated revenue currently recoverable</p>
            <div className="mt-6 space-y-3 border-t border-border pt-5">
              {[
                { label: "Leads", value: 1850, icon: Users },
                { label: "Quotes", value: 3400, icon: FileText },
                { label: "Invoices", value: 2470, icon: Receipt },
                { label: "Dormant customers", value: 700, icon: UserCheck },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted">
                    <row.icon className="size-4" />
                    {row.label}
                  </span>
                  <span className="font-medium tabular-nums">{formatMoney(row.value)}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-muted">Illustrative example — actual results vary.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-border bg-surface-2/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground">
            How it works
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Connect your data",
                body: "Add customers, leads, quotes and invoices — or import a CSV in minutes.",
              },
              {
                step: "2",
                title: "See what's leaking",
                body: "Kiwi Job Cash scans everything and shows exactly where money is sitting unclaimed.",
              },
              {
                step: "3",
                title: "Review AI actions",
                body: "Every opportunity comes with a ready-to-send message — you approve before anything goes out.",
              },
              {
                step: "4",
                title: "Watch it add up",
                body: "Track every dollar recovered, and build the habit of chasing the money daily.",
              },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-border bg-surface p-6">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand-dark">
                  {item.step}
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECOVERY PILLARS */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground">
          Four ways we find your money
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            {
              icon: Users,
              title: "Lead recovery",
              body: "Never let a hot lead go cold. Kiwi Job Cash flags untouched and high-value leads and drafts your next message.",
            },
            {
              icon: FileText,
              title: "Quote recovery",
              body: "Chase quotes before they expire. See exactly which ones are hot, warm or cold — and follow up in one click.",
            },
            {
              icon: Receipt,
              title: "Invoice recovery",
              body: "Get paid faster with friendly, firm and final reminders — ageing buckets show you what's overdue and by how much.",
            },
            {
              icon: UserCheck,
              title: "Customer reactivation",
              body: "Find customers who've gone quiet and estimate what bringing them back could be worth.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
                <item.icon className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI BUSINESS MANAGER + PROFIT RADAR */}
      <section className="border-y border-border bg-surface-2/50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
              <Bot className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">AI Business Manager</h3>
            <p className="mt-2 text-sm text-muted">
              Every morning, get a plain-English summary: what&apos;s at risk, what to
              chase today, and what needs your attention — plus Ask Kiwi, a chat
              assistant that answers questions straight from your own business data.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
              <Radar className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">Profit Radar</h3>
            <p className="mt-2 text-sm text-muted">
              See revenue, costs and margin by job and by customer. We clearly label
              what&apos;s reported, estimated or projected — never guessed as fact.
            </p>
          </div>
        </div>
      </section>

      {/* EXAMPLE RECOVERY CALC */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground">
          A worked example
        </h2>
        <p className="mt-3 text-center text-muted">
          Illustrative example for a 4-person plumbing business — actual results vary.
        </p>
        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface">
          {[
            { label: "3 uncontacted leads worth", value: 2100 },
            { label: "4 quotes waiting on follow-up", value: 3850 },
            { label: "2 overdue invoices", value: 1480 },
            { label: "3 dormant customers, historical average job value", value: 990 },
          ].map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-6 py-4 text-sm ${i > 0 ? "border-t border-border" : ""}`}
            >
              <span className="text-muted">{row.label}</span>
              <span className="font-medium tabular-nums">{formatMoney(row.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border bg-brand-light/40 px-6 py-5">
            <span className="font-semibold text-foreground">Estimated opportunity</span>
            <span className="text-2xl font-semibold tabular-nums text-money">
              {formatMoney(8420)}
            </span>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-y border-border bg-surface-2/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mb-8 flex items-center justify-center gap-2">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground">
              What business owners say
            </h2>
          </div>
          <p className="mx-auto mb-10 max-w-xl text-center text-sm text-muted">
            Kiwi Job Cash is new — these are illustrative example testimonials showing
            the kind of impact we&apos;re building toward, clearly labelled until we
            have real customer stories to share.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "\"I had no idea I had that many quotes just sitting there. Chased three in a morning, won two.\"",
                name: "Example — Electrician, Hamilton",
              },
              {
                quote:
                  "\"The overdue invoice reminders alone would pay for this. Simple, straight to the point.\"",
                name: "Example — Plumber, Wellington",
              },
              {
                quote:
                  "\"Feels like having someone in the office whose whole job is chasing the money.\"",
                name: "Example — Builder, Tauranga",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-surface p-6">
                <Badge tone="neutral" className="mb-4">
                  Demo testimonial
                </Badge>
                <p className="text-sm text-foreground">{t.quote}</p>
                <p className="mt-4 text-sm font-medium text-muted">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground">
          Simple pricing
        </h2>
        <p className="mt-3 text-center text-muted">
          Start free. Upgrade when Kiwi Job Cash starts paying for itself.
        </p>
        <PricingGrid plans={PLANS} className="mt-12" />
      </section>

      {/* FAQ TEASER */}
      <section className="border-t border-border bg-surface-2/50">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Questions?</h2>
          <p className="mt-3 text-muted">
            Read our FAQ or get in touch — we reply quickly.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button href="/faq" variant="outline">
              Read the FAQ
            </Button>
            <Button href="/contact" variant="ghost">
              Contact us
            </Button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-ink">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Stop wondering. Find out what you&apos;re owed.
          </h2>
          <p className="mt-4 text-white/70">
            Free 60-second scan. See your estimated opportunity before you sign up.
          </p>
          <div className="mt-8">
            <Button href="/money-leak-scan" size="lg">
              Find my lost money
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
