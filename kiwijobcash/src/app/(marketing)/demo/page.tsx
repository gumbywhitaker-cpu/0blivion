"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PlayCircle, CheckCircle2 } from "lucide-react";

export default function DemoPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function startDemo() {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/start", { method: "POST" });
      if (!res.ok) return;
      router.push("/app");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Try Dave&apos;s Plumbing
      </h1>
      <p className="mt-4 text-lg text-muted">
        A fully working demo business with realistic — completely fictional — customers, leads,
        quotes, invoices and jobs. No signup required.
      </p>

      <Button size="lg" className="mt-8" onClick={startDemo} loading={loading} icon={<PlayCircle className="size-4" />}>
        See my money leaks
      </Button>

      <ul className="mx-auto mt-10 flex max-w-sm flex-col gap-2 text-left text-sm text-muted">
        {[
          "20 customers, 10 leads, 10 quotes, 10 invoices, 15 jobs",
          "Overdue invoices, hot leads, dormant customers — all fictional",
          "See the full dashboard, Action Centre, Money page and Ask Kiwi",
          "Your own private demo session — nothing you touch affects anyone else",
        ].map((t) => (
          <li key={t} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
            {t}
          </li>
        ))}
      </ul>

      <p className="mt-10 text-xs text-muted">
        All names, jobs and figures in the demo are fictional example data.
      </p>
    </div>
  );
}
