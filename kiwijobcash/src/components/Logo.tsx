import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
        K
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        Kiwi Job Cash
      </span>
    </span>
  );
}
