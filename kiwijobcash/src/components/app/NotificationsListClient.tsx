"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { formatDateTime } from "@/lib/format";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
};

export function NotificationsListClient({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    router.refresh();
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="size-6" />}
        title="No notifications yet"
        description="We'll let you know about new leads, overdue invoices and daily reports here."
      />
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => {
        const content = (
          <div
            className={`rounded-xl border p-4 ${n.read ? "border-border bg-surface" : "border-brand/30 bg-brand-light/40"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  {!n.read && <Badge tone="brand">New</Badge>}
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-muted">{n.message}</p>
                <p className="mt-2 text-xs text-muted">{formatDateTime(n.createdAt)}</p>
              </div>
            </div>
          </div>
        );
        return (
          <div key={n.id} onClick={() => !n.read && markRead(n.id)} className="cursor-pointer">
            {n.actionUrl ? <Link href={n.actionUrl}>{content}</Link> : content}
          </div>
        );
      })}
    </div>
  );
}
