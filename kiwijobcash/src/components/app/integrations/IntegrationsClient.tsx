"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FormField, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/format";
import type { IntegrationProvider } from "@/lib/integrations";

type Integration = {
  provider: IntegrationProvider;
  name: string;
  description: string;
  kind: "oauth" | "apikey" | "webhook";
  configured: boolean;
  status: string;
  lastSyncAt: string | null;
  fromNumber?: string;
  webhookUrl?: string;
};

function statusBadge(status: string) {
  if (status === "CONNECTED") return <Badge tone="success">Connected</Badge>;
  if (status === "ERROR") return <Badge tone="danger">Error</Badge>;
  return <Badge tone="neutral">Not connected</Badge>;
}

export function IntegrationsClient({
  integrations,
  canManage,
}: {
  integrations: Integration[];
  canManage: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  React.useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) toast.push(`${connected[0].toUpperCase()}${connected.slice(1)} connected.`, "success");
    if (error) toast.push(errorMessage(error), "error");
    if (connected || error) router.replace("/app/integrations");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function disconnect(provider: string) {
    const res = await fetch(`/api/integrations/${provider.toLowerCase()}/disconnect`, { method: "POST" });
    if (!res.ok) {
      toast.push("Couldn't disconnect. Try again.", "error");
      return;
    }
    toast.push("Disconnected.", "success");
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.provider}
          integration={integration}
          canManage={canManage}
          onDisconnect={() => disconnect(integration.provider)}
        />
      ))}
    </div>
  );
}

function IntegrationCard({
  integration,
  canManage,
  onDisconnect,
}: {
  integration: Integration;
  canManage: boolean;
  onDisconnect: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [expanded, setExpanded] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [twilioForm, setTwilioForm] = React.useState({
    accountSid: "",
    authToken: "",
    fromNumber: integration.fromNumber ?? "",
  });
  const [webhookUrl, setWebhookUrl] = React.useState(integration.webhookUrl ?? "");

  async function saveTwilio(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/twilio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(twilioForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Couldn't save Twilio credentials.", "error");
        return;
      }
      toast.push("Twilio connected.", "success");
      setExpanded(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveZapier(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/zapier", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Couldn't save that webhook URL.", "error");
        return;
      }
      toast.push(data.error ?? "Zapier connected.", data.error ? "info" : "success");
      setExpanded(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title={integration.name} subtitle={integration.description} action={statusBadge(integration.status)} />

      {integration.status === "CONNECTED" && integration.lastSyncAt && (
        <p className="text-xs text-muted">Connected {formatDateTime(integration.lastSyncAt)}</p>
      )}

      {!canManage ? (
        <p className="mt-2 text-sm text-muted">Ask an admin to manage integrations.</p>
      ) : integration.kind === "oauth" ? (
        <div className="mt-3">
          {!integration.configured ? (
            <p className="text-sm text-muted">Not configured in this environment yet.</p>
          ) : integration.status === "CONNECTED" ? (
            <Button variant="outline" size="sm" onClick={onDisconnect}>
              Disconnect
            </Button>
          ) : (
            <Button href={`/api/integrations/${integration.provider.toLowerCase()}/connect`} size="sm">
              Connect {integration.name.split(" ")[0]}
            </Button>
          )}
        </div>
      ) : integration.provider === "TWILIO" ? (
        <div className="mt-3">
          {integration.status === "CONNECTED" && !expanded ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted">Sending from {integration.fromNumber}</p>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onDisconnect}>
                Disconnect
              </Button>
            </div>
          ) : expanded || integration.status !== "CONNECTED" ? (
            <form onSubmit={saveTwilio} className="grid gap-3 sm:grid-cols-3">
              <FormField label="Account SID">
                <Input
                  value={twilioForm.accountSid}
                  onChange={(e) => setTwilioForm((f) => ({ ...f, accountSid: e.target.value }))}
                  placeholder="ACxxxxxxxx"
                  required
                />
              </FormField>
              <FormField label="Auth token">
                <Input
                  type="password"
                  value={twilioForm.authToken}
                  onChange={(e) => setTwilioForm((f) => ({ ...f, authToken: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="From number">
                <Input
                  value={twilioForm.fromNumber}
                  onChange={(e) => setTwilioForm((f) => ({ ...f, fromNumber: e.target.value }))}
                  placeholder="+64 21 000 0000"
                  required
                />
              </FormField>
              <div className="sm:col-span-3">
                <Button type="submit" size="sm" loading={saving}>
                  Save
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : integration.provider === "ZAPIER" ? (
        <div className="mt-3">
          {integration.status === "CONNECTED" && !expanded ? (
            <div className="flex items-center gap-2">
              <p className="truncate text-sm text-muted">{integration.webhookUrl}</p>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onDisconnect}>
                Disconnect
              </Button>
            </div>
          ) : (
            <form onSubmit={saveZapier} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <FormField label="Zapier webhook URL">
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    required
                  />
                </FormField>
              </div>
              <Button type="submit" size="sm" loading={saving}>
                Save
              </Button>
            </form>
          )}
        </div>
      ) : null}
    </Card>
  );
}

function errorMessage(code: string) {
  const messages: Record<string, string> = {
    google_not_configured: "Google isn't configured in this environment yet.",
    xero_not_configured: "Xero isn't configured in this environment yet.",
    google_denied: "Google connection was cancelled.",
    xero_denied: "Xero connection was cancelled.",
    google_state_mismatch: "That connection attempt expired. Try again.",
    xero_state_mismatch: "That connection attempt expired. Try again.",
    google_exchange_failed: "Couldn't finish connecting Google. Try again.",
    xero_exchange_failed: "Couldn't finish connecting Xero. Try again.",
  };
  return messages[code] ?? "Something went wrong connecting that integration.";
}
