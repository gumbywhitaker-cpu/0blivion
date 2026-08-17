"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Users,
  UserPlus,
  FileText,
  Receipt,
  Briefcase,
  Wallet,
  Bot,
  X,
} from "lucide-react";

const CREATE_OPTIONS = [
  { href: "/app/customers?new=1", label: "Customer", icon: UserPlus },
  { href: "/app/leads?new=1", label: "Lead", icon: Users },
  { href: "/app/quotes?new=1", label: "Quote", icon: FileText },
  { href: "/app/invoices?new=1", label: "Invoice", icon: Receipt },
  { href: "/app/jobs?new=1", label: "Job", icon: Briefcase },
  { href: "/app/money?new=expense", label: "Expense", icon: Wallet },
  { href: "/app/ai", label: "AI Action", icon: Bot },
];

export function CreateMenu() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Create new"
        className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform active:scale-95"
      >
        <Plus className="size-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl border border-border bg-surface p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-semibold text-foreground">Create new</p>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-muted hover:bg-surface-2"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {CREATE_OPTIONS.map((opt) => (
                <Link
                  key={opt.label}
                  href={opt.href}
                  onClick={() => setOpen(false)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-2 p-3.5 text-center text-xs font-medium text-foreground"
                >
                  <opt.icon className="size-5 text-brand" />
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
