import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Plan } from "@/lib/plans";

export function PricingGrid({
  plans,
  className,
}: {
  plans: Plan[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-4", className)}>
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "flex flex-col rounded-2xl border bg-surface p-6",
            plan.highlight ? "border-brand shadow-md ring-1 ring-brand" : "border-border"
          )}
        >
          {plan.highlight && (
            <span className="mb-3 inline-block w-fit rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-dark">
              Most popular
            </span>
          )}
          <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
          <p className="mt-5 flex items-baseline gap-1">
            <span className="text-3xl font-semibold tracking-tight text-foreground">
              ${plan.priceMonthlyNzd}
            </span>
            <span className="text-sm text-muted">NZD/mo</span>
          </p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            href={`/signup?plan=${plan.id}`}
            variant={plan.highlight ? "primary" : "outline"}
            className="mt-6"
            fullWidth
          >
            {plan.id === "FREE" ? "Start free" : `Choose ${plan.name}`}
          </Button>
        </div>
      ))}
    </div>
  );
}
