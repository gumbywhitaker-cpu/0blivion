import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function UsageBanner({
  used,
  limit,
  percentUsed,
  planName,
}: {
  used: number;
  limit: number;
  percentUsed: number;
  planName: string;
}) {
  const atLimit = used >= limit;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 bg-warning-light px-4 py-2 text-center text-sm text-warning">
      <AlertTriangle className="size-4 shrink-0" />
      <span>
        {atLimit
          ? `You've used all ${limit} AI actions included in the ${planName} plan this month.`
          : `You've used ${used} of ${limit} AI actions (${percentUsed}%) included in the ${planName} plan this month.`}
      </span>
      <Link href="/app/settings/billing" className="font-semibold underline">
        Upgrade for more
      </Link>
    </div>
  );
}
