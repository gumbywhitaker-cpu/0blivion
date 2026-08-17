import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Users, FileText, Receipt, UserCheck, Bot, Radar, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Kiwi Job Cash finds and helps you recover missed leads, quotes and overdue invoices.",
};

const STEPS = [
  {
    icon: Users,
    title: "1. Add your business data",
    body: "Add customers, leads, quotes and invoices — or import a spreadsheet in a few minutes. No accounting knowledge required.",
  },
  {
    icon: Radar,
    title: "2. Kiwi Job Cash scans for money leaks",
    body: "Every day, it checks your leads, quotes and invoices for anything that's gone quiet — an uncontacted enquiry, a forgotten quote, an overdue bill.",
  },
  {
    icon: Bot,
    title: "3. Review AI-prepared actions",
    body: "For every opportunity found, Kiwi Job Cash drafts a follow-up message in plain English. You review, edit if needed, and approve.",
  },
  {
    icon: CheckCircle2,
    title: "4. Send it and track the result",
    body: "Send with one click. When the customer responds, mark the outcome — won, lost, or no response — and watch your Money Recovered total grow.",
  },
];

const PILLARS = [
  { icon: Users, title: "Lead recovery", body: "Catch enquiries before they go cold." },
  { icon: FileText, title: "Quote recovery", body: "Chase quotes before they expire." },
  { icon: Receipt, title: "Invoice recovery", body: "Get paid faster with the right reminder." },
  { icon: UserCheck, title: "Customer reactivation", body: "Bring dormant customers back." },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          How Kiwi Job Cash works
        </h1>
        <p className="mt-4 text-lg text-muted">
          Four simple steps between you and the money you&apos;re currently leaving on the table.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <div className="space-y-6">
          {STEPS.map((step) => (
            <div key={step.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
                <step.icon className="size-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{step.title}</h2>
                <p className="mt-1.5 text-muted">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface-2/50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-semibold text-foreground">
            The four places money leaks
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border bg-surface p-5 text-center">
                <p.icon className="mx-auto size-6 text-brand" />
                <h3 className="mt-3 font-semibold text-foreground">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <h2 className="text-2xl font-semibold text-foreground">See it in action</h2>
        <p className="mt-3 text-muted">Try the free scan or explore a demo business with realistic data.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button href="/money-leak-scan">Find my lost money</Button>
          <Button href="/demo" variant="outline">
            Try the demo
          </Button>
        </div>
      </section>
    </>
  );
}
