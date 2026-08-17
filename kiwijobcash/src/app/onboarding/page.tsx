"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { formatMoney } from "@/lib/format";
import { estimateOnboardingOpportunity, REVENUE_BANDS } from "@/lib/money-map";
import { CheckCircle2, PlusCircle, Upload, PlayCircle } from "lucide-react";

const INDUSTRIES = [
  "Plumbing",
  "Electrical",
  "Building / construction",
  "Roofing",
  "Landscaping",
  "Painting",
  "Mechanic",
  "Mobile mechanic",
  "Concreting",
  "Transport / owner-driver",
  "Cleaning",
  "HVAC",
  "Property maintenance",
  "Other trade or service business",
];

const EMPLOYEE_COUNTS = ["Just me", "2–3", "4–6", "7–10", "10+"];

const CRM_METHODS = [
  "Spreadsheet",
  "Accounting software",
  "Job management software",
  "Paper",
  "Other / nothing yet",
];

const HEADACHES = [
  { id: "LEADS", label: "Getting new customers" },
  { id: "QUOTES", label: "Following up quotes" },
  { id: "INVOICES", label: "Getting invoices paid" },
  { id: "RETENTION", label: "Keeping customers" },
  { id: "PROFIT", label: "Understanding profit" },
  { id: "ADMIN", label: "Admin" },
];

type FormState = {
  name: string;
  industry: string;
  employeeCount: string;
  averageJobValue: string;
  monthlyRevenueRange: string;
  crmMethod: string;
  biggestHeadache: string;
};

const TOTAL_STEPS = 7;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({
    name: "",
    industry: "",
    employeeCount: "",
    averageJobValue: "",
    monthlyRevenueRange: "",
    crmMethod: "",
    biggestHeadache: "",
  });

  const opportunity = estimateOnboardingOpportunity({
    averageJobValue: form.averageJobValue ? Number(form.averageJobValue) : null,
    monthlyRevenueRange: form.monthlyRevenueRange,
  });

  async function finish() {
    setSaving(true);
    try {
      await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          industry: form.industry || undefined,
          businessType: form.industry || undefined,
          employeeCount: form.employeeCount || undefined,
          averageJobValue: form.averageJobValue ? Number(form.averageJobValue) : undefined,
          monthlyRevenueRange: form.monthlyRevenueRange || undefined,
          crmMethod: form.crmMethod || undefined,
          biggestHeadache: form.biggestHeadache || undefined,
          onboardingCompleted: true,
          onboardingStep: TOTAL_STEPS,
        }),
      });
    } finally {
      setSaving(false);
      setStep(TOTAL_STEPS + 1);
    }
  }

  if (step === TOTAL_STEPS + 1) {
    return <MoneyMap opportunity={opportunity} onDone={() => router.push("/app")} />;
  }

  return (
    <Card>
      <ProgressDots step={step} total={TOTAL_STEPS} />

      {step === 1 && (
        <StepShell title="What's your business called?">
          <Input
            autoFocus
            placeholder="e.g. Dave's Plumbing"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </StepShell>
      )}

      {step === 2 && (
        <StepShell title="What do you do?">
          <div className="grid grid-cols-2 gap-2">
            {INDUSTRIES.map((option) => (
              <ChoiceButton
                key={option}
                selected={form.industry === option}
                onClick={() => setForm({ ...form, industry: option })}
              >
                {option}
              </ChoiceButton>
            ))}
          </div>
        </StepShell>
      )}

      {step === 3 && (
        <StepShell title="How many people work in the business?">
          <div className="grid grid-cols-2 gap-2">
            {EMPLOYEE_COUNTS.map((option) => (
              <ChoiceButton
                key={option}
                selected={form.employeeCount === option}
                onClick={() => setForm({ ...form, employeeCount: option })}
              >
                {option}
              </ChoiceButton>
            ))}
          </div>
        </StepShell>
      )}

      {step === 4 && (
        <StepShell title="What's your average job value?" subtitle="Rough figure is fine.">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <Input
              type="number"
              min={0}
              className="pl-7"
              placeholder="850"
              value={form.averageJobValue}
              onChange={(e) => setForm({ ...form, averageJobValue: e.target.value })}
            />
          </div>
        </StepShell>
      )}

      {step === 5 && (
        <StepShell title="Approximately, what's your monthly revenue?">
          <div className="space-y-2">
            {REVENUE_BANDS.map((band) => (
              <ChoiceButton
                key={band.id}
                selected={form.monthlyRevenueRange === band.id}
                onClick={() => setForm({ ...form, monthlyRevenueRange: band.id })}
                fullWidth
              >
                {band.label}
              </ChoiceButton>
            ))}
          </div>
        </StepShell>
      )}

      {step === 6 && (
        <StepShell title="How do you currently manage customers?">
          <div className="space-y-2">
            {CRM_METHODS.map((option) => (
              <ChoiceButton
                key={option}
                selected={form.crmMethod === option}
                onClick={() => setForm({ ...form, crmMethod: option })}
                fullWidth
              >
                {option}
              </ChoiceButton>
            ))}
          </div>
        </StepShell>
      )}

      {step === 7 && (
        <StepShell title="What's your biggest headache right now?">
          <div className="space-y-2">
            {HEADACHES.map((option) => (
              <ChoiceButton
                key={option.id}
                selected={form.biggestHeadache === option.id}
                onClick={() => setForm({ ...form, biggestHeadache: option.id })}
                fullWidth
              >
                {option.label}
              </ChoiceButton>
            ))}
          </div>
        </StepShell>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className={step === 1 ? "invisible" : ""}
        >
          Back
        </Button>
        {step < TOTAL_STEPS ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!stepValid(step, form)}>
            Continue
          </Button>
        ) : (
          <Button onClick={finish} loading={saving} disabled={!stepValid(step, form)}>
            See my business money map
          </Button>
        )}
      </div>
    </Card>
  );
}

function stepValid(step: number, form: FormState) {
  switch (step) {
    case 1:
      return form.name.trim().length > 0;
    case 2:
      return form.industry.length > 0;
    case 3:
      return form.employeeCount.length > 0;
    case 4:
      return true; // optional
    case 5:
      return form.monthlyRevenueRange.length > 0;
    case 6:
      return form.crmMethod.length > 0;
    case 7:
      return form.biggestHeadache.length > 0;
    default:
      return true;
  }
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
  fullWidth,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
        fullWidth ? "w-full" : ""
      } ${
        selected
          ? "border-brand bg-brand-light text-brand-dark"
          : "border-border bg-surface text-foreground hover:bg-surface-2"
      }`}
    >
      {children}
      {selected && <CheckCircle2 className="size-4 shrink-0" />}
    </button>
  );
}

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6 flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-brand" : "bg-surface-2"}`}
        />
      ))}
    </div>
  );
}

function MoneyMap({ opportunity, onDone }: { opportunity: number; onDone: () => void }) {
  return (
    <Card>
      <p className="text-sm font-medium text-brand-dark">Your business money map</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-money tabular-nums">
        {formatMoney(opportunity)}
      </p>
      <p className="mt-2 text-sm text-muted">
        Estimated opportunity based on the information you provided. This isn&apos;t a
        guarantee — it becomes accurate once we can see your real leads, quotes and
        invoices.
      </p>

      <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4">
        <p className="text-sm font-semibold text-foreground">Let&apos;s find your first $1,000</p>
        <p className="mt-1 text-sm text-muted">
          Add your first few records (or import a CSV) and Kiwi Job Cash will start
          finding real opportunities straight away.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button href="/app/customers?new=1" variant="outline" size="sm" icon={<PlusCircle className="size-4" />}>
            Add customer
          </Button>
          <Button href="/app/integrations" variant="outline" size="sm" icon={<Upload className="size-4" />}>
            Import CSV
          </Button>
          <Button href="/app?demo=1" variant="outline" size="sm" icon={<PlayCircle className="size-4" />}>
            Try demo data
          </Button>
        </div>
      </div>

      <Button onClick={onDone} fullWidth className="mt-6">
        Go to my dashboard
      </Button>
    </Card>
  );
}
