"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/Field";
import { formatMoney } from "@/lib/format";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const BUSINESS_TYPES = [
  "Plumbing",
  "Electrical",
  "Building / construction",
  "Roofing",
  "Landscaping",
  "Painting",
  "Mechanic",
  "Concreting",
  "Transport",
  "Cleaning",
  "HVAC",
  "Property maintenance",
  "Other",
];

type FormState = {
  businessType: string;
  monthlyRevenue: string;
  employeeCount: string;
  averageJobValue: string;
  monthlyEnquiries: string;
  monthlyQuotes: string;
  overdueInvoiceCount: string;
  overdueInvoiceValue: string;
  dormantCustomerCount: string;
};

const TOTAL_STEPS = 3;

export default function MoneyLeakScanPage() {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [result, setResult] = React.useState<{
    leadLeak: number;
    quoteLeak: number;
    invoiceLeak: number;
    dormantLeak: number;
    total: number;
  } | null>(null);

  const [form, setForm] = React.useState<FormState>({
    businessType: "",
    monthlyRevenue: "",
    employeeCount: "",
    averageJobValue: "",
    monthlyEnquiries: "",
    monthlyQuotes: "",
    overdueInvoiceCount: "",
    overdueInvoiceValue: "",
    dormantCustomerCount: "",
  });

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function runScan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/money-leak-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          businessType: form.businessType,
          monthlyRevenue: Number(form.monthlyRevenue) || 0,
          employeeCount: Number(form.employeeCount) || 0,
          averageJobValue: Number(form.averageJobValue) || 0,
          monthlyEnquiries: Number(form.monthlyEnquiries) || 0,
          monthlyQuotes: Number(form.monthlyQuotes) || 0,
          overdueInvoiceCount: Number(form.overdueInvoiceCount) || 0,
          overdueInvoiceValue: Number(form.overdueInvoiceValue) || 0,
          dormantCustomerCount: Number(form.dormantCustomerCount) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setResult(data.result);
      setStep(TOTAL_STEPS + 1);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === TOTAL_STEPS + 1 && result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <Card>
          <p className="text-sm font-medium text-brand-dark">Your estimated revenue opportunity</p>
          <p className="mt-2 text-5xl font-semibold tracking-tight text-money tabular-nums">
            {formatMoney(result.total)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Estimated opportunity based on the information you provided — not a guarantee.
          </p>

          <div className="mt-6 space-y-3 border-t border-border pt-5">
            {[
              { label: "Potential missed revenue (leads)", value: result.leadLeak },
              { label: "Potential quote recovery", value: result.quoteLeak },
              { label: "Potential overdue cash", value: result.invoiceLeak },
              { label: "Potential dormant customer revenue", value: result.dormantLeak },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-muted">{row.label}</span>
                <span className="font-medium tabular-nums">{formatMoney(row.value)}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-brand-light p-5">
            <p className="text-sm font-semibold text-brand-dark">See how Kiwi Job Cash can recover it</p>
            <p className="mt-1 text-sm text-brand-dark/80">
              Create a free account and Kiwi Job Cash will start finding real opportunities from your
              actual leads, quotes and invoices.
            </p>
            <Button href="/signup" className="mt-4" icon={<ArrowRight className="size-4" />}>
              Create my free account
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Find your lost money
        </h1>
        <p className="mt-3 text-muted">
          60 seconds. No card, no signup required to see your estimate.
        </p>
      </div>

      <Card>
        <ProgressDots step={step} total={TOTAL_STEPS} />

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">About your business</h2>
            <FormField label="What do you do?" htmlFor="type">
              <Select id="type" value={form.businessType} onChange={(e) => set("businessType", e.target.value)}>
                <option value="">Select…</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Approx. monthly revenue ($)" htmlFor="rev">
                <Input id="rev" type="number" min={0} value={form.monthlyRevenue} onChange={(e) => set("monthlyRevenue", e.target.value)} />
              </FormField>
              <FormField label="Number of employees" htmlFor="emp">
                <Input id="emp" type="number" min={0} value={form.employeeCount} onChange={(e) => set("employeeCount", e.target.value)} />
              </FormField>
            </div>
            <FormField label="Average job value ($)" htmlFor="jobval">
              <Input id="jobval" type="number" min={0} value={form.averageJobValue} onChange={(e) => set("averageJobValue", e.target.value)} />
            </FormField>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Leads and quotes</h2>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Monthly enquiries" htmlFor="enq">
                <Input id="enq" type="number" min={0} value={form.monthlyEnquiries} onChange={(e) => set("monthlyEnquiries", e.target.value)} />
              </FormField>
              <FormField label="Monthly quotes sent" htmlFor="qts">
                <Input id="qts" type="number" min={0} value={form.monthlyQuotes} onChange={(e) => set("monthlyQuotes", e.target.value)} />
              </FormField>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={runScan} className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Invoices and customers</h2>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Overdue invoices (count)" htmlFor="ovc">
                <Input id="ovc" type="number" min={0} value={form.overdueInvoiceCount} onChange={(e) => set("overdueInvoiceCount", e.target.value)} />
              </FormField>
              <FormField label="Overdue value ($)" htmlFor="ovv">
                <Input id="ovv" type="number" min={0} value={form.overdueInvoiceValue} onChange={(e) => set("overdueInvoiceValue", e.target.value)} />
              </FormField>
            </div>
            <FormField label="Dormant customers (haven't booked in 6+ months)" htmlFor="dorm">
              <Input id="dorm" type="number" min={0} value={form.dormantCustomerCount} onChange={(e) => set("dormantCustomerCount", e.target.value)} />
            </FormField>
            <FormField label="Email (optional — to save your results)" htmlFor="email">
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.co.nz" />
            </FormField>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" fullWidth loading={loading} size="lg">
              See my estimated opportunity
            </Button>
          </form>
        )}

        {step < TOTAL_STEPS && (
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} className={step === 1 ? "invisible" : ""}>
              Back
            </Button>
            <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
          </div>
        )}
      </Card>

      <ul className="mx-auto mt-8 flex max-w-md flex-col gap-2 text-sm text-muted">
        {["No card required", "Takes about a minute", "See your estimate instantly"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-brand" /> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6 flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-brand" : "bg-surface-2"}`} />
      ))}
    </div>
  );
}
