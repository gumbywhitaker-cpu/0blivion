"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: ToastTone };

type ToastContextValue = {
  push: (message: string, tone?: ToastTone) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

let idCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((message: string, tone: ToastTone = "info") => {
    const id = ++idCounter;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((toast) => toast.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:right-6 sm:left-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border bg-surface p-3.5 text-sm shadow-lg",
              toast.tone === "success" && "border-brand/30",
              toast.tone === "error" && "border-danger/30",
              toast.tone === "info" && "border-border"
            )}
          >
            {toast.tone === "success" && (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
            )}
            {toast.tone === "error" && (
              <XCircle className="mt-0.5 size-4 shrink-0 text-danger" />
            )}
            {toast.tone === "info" && <Info className="mt-0.5 size-4 shrink-0 text-info" />}
            <p className="flex-1 text-foreground">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
