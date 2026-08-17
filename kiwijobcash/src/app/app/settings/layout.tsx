import type { ReactNode } from "react";
import { requireBusiness } from "@/lib/session";
import { hasPermission, type Role } from "@/lib/permissions";
import { SettingsTabs } from "@/components/app/settings/SettingsTabs";

const TABS = [
  { href: "/app/settings/profile", label: "Business profile" },
  { href: "/app/settings/team", label: "Team", permission: "team:manage" as const },
  { href: "/app/settings/billing", label: "Billing", permission: "billing:manage" as const },
  { href: "/app/settings/automation", label: "Automation", permission: "automation:manage" as const },
];

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const { membership } = await requireBusiness();
  const role = membership.role as Role;

  const visibleTabs = TABS.filter((tab) => !tab.permission || hasPermission(role, tab.permission));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
      <SettingsTabs tabs={visibleTabs} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
