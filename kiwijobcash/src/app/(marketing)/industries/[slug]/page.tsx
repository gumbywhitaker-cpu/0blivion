import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/format";
import { getIndustry, INDUSTRIES } from "@/lib/industries";
import { CheckCircle2 } from "lucide-react";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata(
  props: PageProps<"/industries/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const industry = getIndustry(slug);
  if (!industry) return {};
  return {
    title: `Kiwi Job Cash for ${industry.name}`,
    description: `${industry.headline} See common money leaks for ${industry.name.toLowerCase()} and how Kiwi Job Cash helps recover them.`,
  };
}

export default async function IndustryPage(props: PageProps<"/industries/[slug]">) {
  const { slug } = await props.params;
  const industry = getIndustry(slug);
  if (!industry) notFound();

  const total = industry.roiExample.reduce((s, r) => s + r.value, 0);

  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-brand-light/60 to-transparent">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="text-sm font-medium text-brand-dark">For {industry.name.toLowerCase()}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {industry.headline}
          </h1>
          <div className="mt-8 flex justify-center gap-3">
            <Button href="/money-leak-scan" size="lg">
              Find my lost money
            </Button>
            <Button href="/demo" variant="outline" size="lg">
              Try the demo
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold text-foreground">
          Where {industry.name.toLowerCase()} typically leak money
        </h2>
        <ul className="mt-6 space-y-3">
          {industry.leaks.map((leak) => (
            <li key={leak} className="flex items-start gap-2.5 text-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
              {leak}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border bg-surface-2/50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold text-foreground">Example workflow</h2>
          <p className="mt-4 text-muted">{industry.workflow}</p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-semibold text-foreground">A worked example</h2>
        <p className="mt-2 text-center text-sm text-muted">Illustrative example — actual results vary.</p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface">
          {industry.roiExample.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-6 py-4 text-sm ${i > 0 ? "border-t border-border" : ""}`}
            >
              <span className="text-muted">{row.label}</span>
              <span className="font-medium tabular-nums">{formatMoney(row.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border bg-brand-light/40 px-6 py-5">
            <span className="font-semibold text-foreground">Estimated opportunity</span>
            <span className="text-2xl font-semibold tabular-nums text-money">{formatMoney(total)}</span>
          </div>
        </div>
        <div className="mt-8 text-center">
          <Button href="/money-leak-scan" size="lg">
            Run my own scan
          </Button>
        </div>
      </section>
    </>
  );
}
