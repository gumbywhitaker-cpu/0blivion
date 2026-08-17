"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { CreateMenu } from "@/components/app/CreateMenu";
import { MoreHorizontal } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const first = MOBILE_NAV.slice(0, 2);
  const rest = MOBILE_NAV.slice(2);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden">
      <div className="grid h-16 grid-cols-5 items-stretch px-1">
        {first.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        <div className="flex items-center justify-center">
          <CreateMenu />
        </div>

        {rest.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        <Link
          href="/app/settings"
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[11px] font-medium",
            pathname.startsWith("/app/settings") ? "text-brand" : "text-muted"
          )}
        >
          <MoreHorizontal className="size-5" />
          More
        </Link>
      </div>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

function NavLink({
  item,
  active,
}: {
  item: { href: string; label: string; icon: ComponentType<{ className?: string }> };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-[11px] font-medium",
        active ? "text-brand" : "text-muted"
      )}
    >
      <item.icon className="size-5" />
      {item.label}
    </Link>
  );
}
