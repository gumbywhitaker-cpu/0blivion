"use client";

import { useRouter } from "next/navigation";
import { ActionCard, type ActionCardData } from "@/components/app/ActionCard";
import { EmptyState } from "@/components/ui/States";
import { CheckCircle2 } from "lucide-react";

export function ActionsFeed({
  actions,
  emptyTitle = "You're all caught up",
  emptyDescription = "No opportunities need attention right now. Check back after you add more customers, quotes or invoices.",
}: {
  actions: ActionCardData[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const router = useRouter();

  if (actions.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="size-6" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <ActionCard key={action.id} action={action} onChanged={() => router.refresh()} />
      ))}
    </div>
  );
}
