import * as React from "react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function MetricCard({
  label,
  value,
  hint,
  trend,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  trend?: { value: number; label?: string };
  tone?: "default" | "danger" | "brand";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-5",
        className
      )}
    >
      <p className="text-sm font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 text-3xl font-semibold tabular-nums tracking-tight",
          tone === "danger" && "text-danger",
          tone === "brand" && "text-money"
        )}
      >
        {value}
      </p>
      {(hint || trend) && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                trend.value >= 0 ? "text-money" : "text-danger"
              )}
            >
              {trend.value >= 0 ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {Math.abs(trend.value)}%
            </span>
          )}
          {hint}
        </div>
      )}
    </div>
  );
}

export function MoneyCard({
  label,
  amount,
  hint,
  breakdown,
}: {
  label: string;
  amount: number;
  hint?: string;
  breakdown?: { label: string; amount: number }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-money sm:text-5xl">
        {formatMoney(amount)}
      </p>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
      {breakdown && breakdown.length > 0 && (
        <div className="mt-5 space-y-2.5 border-t border-border pt-4">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-muted">{item.label}</span>
              <span className="font-medium tabular-nums">{formatMoney(item.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
