"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { initials } from "@/lib/format";

export function TopBar({
  userName,
  unreadCount,
}: {
  userName: string;
  unreadCount: number;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
      <Link href="/app" className="md:hidden">
        <Logo />
      </Link>
      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        <Link
          href="/app/notifications"
          className="relative flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-danger" />
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex size-9 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand-dark"
          >
            {initials(userName) || <User className="size-4" />}
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-11 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <Link
                href="/app/settings/profile"
                className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-2"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/app/settings"
                className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-2"
                onClick={() => setMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-surface-2 md:hidden"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
