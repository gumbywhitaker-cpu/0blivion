import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { getIntegrationDefs } from "@/lib/integrations";
import { hasPermission, type Role } from "@/lib/permissions";
import { IntegrationsClient } from "@/components/app/integrations/IntegrationsClient";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const { business, membership } = await requireBusiness();
  const canManage = hasPermission(membership.role as Role, "integrations:manage");

  const rows = await prisma.integration.findMany({ where: { businessId: business.id } });
  const byProvider = new Map(rows.map((r) => [r.provider, r]));

  const integrations = getIntegrationDefs().map((def) => {
    const row = byProvider.get(def.provider);
    let extra: { fromNumber?: string; webhookUrl?: string } = {};
    if (row?.metadata) {
      try {
        const meta = JSON.parse(row.metadata);
        extra = { fromNumber: meta.fromNumber, webhookUrl: meta.webhookUrl };
      } catch {
        // ignore malformed metadata
      }
    }
    return {
      ...def,
      status: row?.status ?? "NOT_CONNECTED",
      lastSyncAt: row?.lastSyncAt?.toISOString() ?? null,
      ...extra,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
        <p className="mt-1 text-muted">
          Connect the tools you already use. Nothing here is on until you turn it on.
        </p>
      </div>
      <Suspense fallback={null}>
        <IntegrationsClient integrations={integrations} canManage={canManage} />
      </Suspense>
    </div>
  );
}
