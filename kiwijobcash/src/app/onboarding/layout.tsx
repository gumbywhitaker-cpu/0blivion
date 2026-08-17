import type { ReactNode } from "react";
import { requireUser } from "@/lib/session";
import { Logo } from "@/components/Logo";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser();
  return (
    <div className="flex min-h-screen flex-col bg-surface-2/40">
      <div className="flex items-center justify-center py-8">
        <Logo />
      </div>
      <main className="flex flex-1 items-start justify-center px-4 pb-16">
        <div className="w-full max-w-xl">{children}</div>
      </main>
    </div>
  );
}
