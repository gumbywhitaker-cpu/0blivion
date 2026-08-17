"use client";

import * as React from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

type Settings = {
  aiRecommendationsEnabled: boolean;
  dailyReportEnabled: boolean;
  dailyReportTime: string;
  dailyReportEmail: boolean;
  dailyReportSms: boolean;
  emailFollowupSuggestions: boolean;
  smsFollowupSuggestions: boolean;
  automaticSending: boolean;
  quoteReminderDays1: number;
  quoteReminderDays2: number;
  invoiceReminderDays1: number;
  invoiceReminderDays2: number;
  invoiceReminderDays3: number;
  customerReactivationDays: number;
  reviewRequestsEnabled: boolean;
};

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-surface-2 border border-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

export function AutomationClient({ settings: initial }: { settings: Settings }) {
  const toast = useToast();
  const [settings, setSettings] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/automation-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Couldn't save automation settings.", "error");
        return;
      }
      toast.push("Automation settings saved.", "success");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="AI & recommendations"
          subtitle="Kiwi Job Cash never sends anything on your behalf unless you turn this on."
        />
        <div className="divide-y divide-border">
          <Toggle
            label="AI recommendations"
            description="Scan leads, quotes, invoices and customers daily for money-leak opportunities."
            checked={settings.aiRecommendationsEnabled}
            onChange={(v) => update("aiRecommendationsEnabled", v)}
          />
          <Toggle
            label="Automatic sending"
            description="Off by default. When off, every AI-drafted message needs your approval before it sends."
            checked={settings.automaticSending}
            onChange={(v) => update("automaticSending", v)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Daily report" subtitle="A morning summary of what needs your attention." />
        <div className="divide-y divide-border">
          <Toggle
            label="Send daily report"
            checked={settings.dailyReportEnabled}
            onChange={(v) => update("dailyReportEnabled", v)}
          />
          <Toggle
            label="Email"
            checked={settings.dailyReportEmail}
            onChange={(v) => update("dailyReportEmail", v)}
          />
          <Toggle
            label="SMS"
            description="Requires SMS to be configured for your business."
            checked={settings.dailyReportSms}
            onChange={(v) => update("dailyReportSms", v)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Follow-up channels" subtitle="Which channels AI-drafted follow-ups can use." />
        <div className="divide-y divide-border">
          <Toggle
            label="Email follow-ups"
            checked={settings.emailFollowupSuggestions}
            onChange={(v) => update("emailFollowupSuggestions", v)}
          />
          <Toggle
            label="SMS follow-ups"
            description="Requires SMS to be configured for your business."
            checked={settings.smsFollowupSuggestions}
            onChange={(v) => update("smsFollowupSuggestions", v)}
          />
          <Toggle
            label="Review requests"
            description="Suggest asking happy customers for a review after a completed job."
            checked={settings.reviewRequestsEnabled}
            onChange={(v) => update("reviewRequestsEnabled", v)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Timing" subtitle="How many days to wait before flagging something as overdue." />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Quote follow-up (1st reminder, days)">
            <Input
              type="number"
              min={1}
              value={settings.quoteReminderDays1}
              onChange={(e) => update("quoteReminderDays1", Number(e.target.value))}
            />
          </FormField>
          <FormField label="Quote follow-up (2nd reminder, days)">
            <Input
              type="number"
              min={1}
              value={settings.quoteReminderDays2}
              onChange={(e) => update("quoteReminderDays2", Number(e.target.value))}
            />
          </FormField>
          <FormField label="Invoice reminder (friendly, days overdue)">
            <Input
              type="number"
              min={1}
              value={settings.invoiceReminderDays1}
              onChange={(e) => update("invoiceReminderDays1", Number(e.target.value))}
            />
          </FormField>
          <FormField label="Invoice reminder (firm, days overdue)">
            <Input
              type="number"
              min={1}
              value={settings.invoiceReminderDays2}
              onChange={(e) => update("invoiceReminderDays2", Number(e.target.value))}
            />
          </FormField>
          <FormField label="Invoice reminder (final, days overdue)">
            <Input
              type="number"
              min={1}
              value={settings.invoiceReminderDays3}
              onChange={(e) => update("invoiceReminderDays3", Number(e.target.value))}
            />
          </FormField>
          <FormField label="Customer dormant after (days)">
            <Input
              type="number"
              min={7}
              value={settings.customerReactivationDays}
              onChange={(e) => update("customerReactivationDays", Number(e.target.value))}
            />
          </FormField>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>
          Save automation settings
        </Button>
      </div>
    </div>
  );
}
