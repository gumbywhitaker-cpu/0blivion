import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logoutAction } from "../(auth)/actions";
import { OfflineIndicator } from "@/lib/offline/OfflineIndicator";
import { checkCertificationExpiries } from "@/lib/certificationExpiry";

function navForSession(orgType: string, role: string): { href: string; label: string }[] {
  // Role checked first: a DRIVER's nav is the same regardless of whether
  // their org is CONTRACTOR or TRANSPORT — orgType alone can't decide it.
  if (role === "DRIVER") {
    return [{ href: "/driver", label: "Deliveries" }, { href: "/settings", label: "Settings" }];
  }

  const common = [
    { href: "/jobs", label: "Jobs" },
    { href: "/invoices", label: "Invoices" },
    { href: "/materials", label: "Materials" },
    { href: "/settings", label: "Settings" },
  ];
  if (orgType === "GROWER") {
    return [
      { href: "/grower", label: "Command Center" },
      { href: "/briefing", label: "Daily Briefing" },
      { href: "/orchards", label: "Orchards" },
      { href: "/contractors", label: "Contractors" },
      { href: "/broadcasts", label: "Broadcasts" },
      { href: "/biosecurity", label: "Biosecurity" },
      { href: "/safety", label: "Health & Safety" },
      { href: "/certifications", label: "Certifications" },
      ...common,
      { href: "/coolstore", label: "Coolstore" },
    ];
  }
  if (orgType === "CONTRACTOR") {
    return [
      { href: "/contractor", label: "Contractor Hub" },
      { href: "/briefing", label: "Daily Briefing" },
      { href: "/crews", label: "Crews" },
      { href: "/broadcasts", label: "Broadcasts" },
      ...common,
    ];
  }
  if (orgType === "PACKHOUSE") {
    return [
      { href: "/packhouse", label: "Incoming" },
      { href: "/packhouse/modular-pipe", label: "Data Bridge" },
      { href: "/export", label: "Export" },
      { href: "/coolstore", label: "Coolstore" },
      ...common,
    ];
  }
  if (orgType === "TRANSPORT") {
    // TKL Logistics is the real-world template: a road transport + wharf
    // logistics operator, not a separate "port" org — it runs its own
    // coolstore at the wharf and consolidates cargo for vessel loading.
    return [{ href: "/export", label: "Export shipments" }, { href: "/coolstore", label: "Coolstore" }, ...common];
  }
  if (orgType === "ADMIN") {
    return [{ href: "/admin", label: "Platform Admin" }];
  }
  return [{ href: "/dashboard", label: "Dashboard" }, ...common];
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  // Certifications belong to orchards, which only growers own — cheap
  // no-op query on the common "nothing due this week" path (see
  // lib/certificationExpiry.ts for the re-warn dedup).
  if (session.orgType === "GROWER") {
    await checkCertificationExpiries(session.organizationId);
  }
  const unreadCount = await prisma.notification.count({
    where: { userId: session.userId, read: false },
  });
  const navLinks = navForSession(session.orgType, session.role);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-kf-border bg-kf-green-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight">
            <Image src="/brand/kiwiflow-icon.png" alt="" width={28} height={28} priority />
            KiwiFlow
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="btn shrink-0 rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/notifications"
              className="btn relative rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              Alerts
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-kf-gold px-1 text-[11px] font-bold text-kf-green-900">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="btn rounded-md border border-white/30 px-3 py-2 text-sm font-medium hover:bg-white/10"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      {/* Offline job-status sync only matters for the roles that actually
          work disconnected in the field — invisible to everyone else. */}
      {session.orgType === "CONTRACTOR" || session.role === "DRIVER" ? <OfflineIndicator /> : null}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
