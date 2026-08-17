import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-2/40">
      <div className="flex items-center justify-center py-8">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <main className="flex flex-1 items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
