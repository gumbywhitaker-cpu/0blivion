import type { ReactNode } from "react";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/session";
import { Logo } from "@/components/Logo";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/support", label: "Support" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-surface-2">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">Admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted">{user.name}</span>
            <Link href="/app" className="font-medium text-brand hover:underline">
              Back to app
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted hover:border-brand hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
