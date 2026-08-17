import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { INDUSTRIES } from "@/lib/industries";

export const metadata: Metadata = {
  title: "Industries",
  description: "Kiwi Job Cash for plumbers, electricians, builders, roofers, landscapers, mechanics, transport and cleaning businesses.",
};

export default function IndustriesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Built for trade &amp; service businesses</h1>
        <p className="mt-3 text-muted">Every industry leaks money differently. See how Kiwi Job Cash fits yours.</p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {INDUSTRIES.map((i) => (
          <Link
            key={i.slug}
            href={`/industries/${i.slug}`}
            className="group flex items-center justify-between rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand"
          >
            <div>
              <h2 className="font-semibold text-foreground">{i.name}</h2>
              <p className="mt-1 text-sm text-muted">{i.headline}</p>
            </div>
            <ArrowRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </div>
  );
}
