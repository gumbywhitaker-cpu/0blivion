"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn rounded-md border border-kf-border px-4 py-2 text-sm font-medium text-kf-charcoal hover:border-kf-green-500 print:hidden"
    >
      Print / Save as PDF
    </button>
  );
}
