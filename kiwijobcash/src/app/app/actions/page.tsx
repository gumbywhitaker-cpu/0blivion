import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/db";
import { runAgents } from "@/lib/agents/run";
import { ActionsFeed } from "@/components/app/ActionsFeed";
import { ActionCentreControls } from "@/components/app/ActionCentreControls";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Action Centre" };

type SortKey = "recommended" | "value" | "urgency" | "newest";

export default async function ActionCentrePage({
  searchParams,
}: PageProps<"/app/actions">) {
  const { business } = await requireBusiness();
  await runAgents(business.id).catch((err) => console.error("Agent run failed:", err));

  const params = await searchParams;
  const sort = (Array.isArray(params.sort) ? params.sort[0] : params.sort) as SortKey | undefined;

  const actions = await prisma.aIAction.findMany({
    where: { businessId: business.id, status: "PENDING" },
    orderBy: sortToOrderBy(sort ?? "recommended"),
  });

  const totalValue = actions.reduce((sum, a) => sum + (a.estimatedValue ?? 0), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Fix these first</h1>
          <p className="mt-1 text-muted">
            {actions.length} opportunit{actions.length === 1 ? "y" : "ies"} worth{" "}
            <span className="font-medium text-money">{formatMoney(totalValue)}</span>
          </p>
        </div>
        <ActionCentreControls activeSort={sort ?? "recommended"} />
      </div>

      <ActionsFeed actions={actions} />
    </div>
  );
}

function sortToOrderBy(sort: SortKey) {
  switch (sort) {
    case "value":
      return [{ estimatedValue: "desc" as const }];
    case "urgency":
      return [{ priority: "desc" as const }, { createdAt: "asc" as const }];
    case "newest":
      return [{ createdAt: "desc" as const }];
    default:
      return [{ priority: "desc" as const }, { estimatedValue: "desc" as const }];
  }
}
