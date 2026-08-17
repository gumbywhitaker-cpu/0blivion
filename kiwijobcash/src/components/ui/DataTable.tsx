"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

export type Column<T> = {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  getHref,
}: {
  columns: Column<T>[];
  rows: T[];
  getHref?: (row: T) => string;
}) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/60 text-left text-xs font-medium uppercase tracking-wide text-muted">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={cn(
                    "px-4 py-3 font-medium",
                    col.hideOnMobile && "hidden sm:table-cell",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = getHref?.(row);
              return (
                <tr
                  key={row.id}
                  onClick={href ? () => router.push(href) : undefined}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors hover:bg-surface-2/60",
                    href && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.header}
                      className={cn(
                        "px-4 py-3.5 align-middle text-foreground",
                        col.hideOnMobile && "hidden sm:table-cell",
                        col.className
                      )}
                    >
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
