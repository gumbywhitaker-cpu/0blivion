import type { ReactNode } from "react";
import Link from "next/link";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { Sidebar } from "@/components/app/Sidebar";
import { MobileNav } from "@/components/app/MobileNav";
import { TopBar } from "@/components/app/TopBar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, business } = await requireBusiness();

  const [unreadCount, subscription] = await Promise.all([
    prisma.notification.count({
      where: { businessId: business.id, read: false },
    }),
    prisma.subscription.findUnique({ where: { businessId: business.id } }),
  ]);

  const plan = getPlan(subscription?.plan);

  return (
    <div className="flex min-h-screen">
      <Sidebar businessName={business.name} plan={plan.name} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar userName={user.name} unreadCount={unreadCount} />
        {business.isDemo && (
          <div className="flex flex-wrap items-center justify-center gap-2 bg-ink px-4 py-2 text-center text-sm text-white">
            <span>You&apos;re viewing demo data for Dave&apos;s Plumbing — all fictional.</span>
            <Link href="/signup" className="font-semibold underline">
              Create your free account
            </Link>
          </div>
        )}
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
