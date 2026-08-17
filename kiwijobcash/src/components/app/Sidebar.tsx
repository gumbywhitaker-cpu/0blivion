"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { DESKTOP_NAV } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { LogOut } from "lucide-react";

export function Sidebar({
  businessName,
  plan,
}: {
  businessName: string;
  plan: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/app">
          <Logo />
        </Link>
      </div>

      <div className="border-b border-border px-5 py-3">
        <p className="truncate text-sm font-medium text-foreground">{businessName}</p>
        <p className="text-xs text-muted">{plan} plan</p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {DESKTOP_NAV.map((item) => {
          const active =
            item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-light text-brand-dark"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <LogOut className="size-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
