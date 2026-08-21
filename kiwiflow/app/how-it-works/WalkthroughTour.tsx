"use client";

import { useState } from "react";

type Step = {
  title: string;
  department: string;
  body: string;
  image: string;
};

const DEPARTMENTS = ["Grower", "Contractor", "Shared", "Platform Admin"] as const;

const STEPS: Step[] = [
  {
    title: "1. OneTap onboarding",
    department: "Grower",
    body: "A grower generates a QR code for a new contractor from the Contractors page — no name or email required up front. The contractor scans it on their own phone and sets up their own account. No forms for the grower to chase, no back-and-forth over text.",
    image: "/screenshots/contractors-onboarding.png",
  },
  {
    title: "2. Command Center",
    department: "Grower",
    body: "The grower's home screen: what's committed this month, what's outstanding, the job pipeline by status, live weather with a spray-window indicator, and recent alerts. Every dollar shown traces back to a real invoice — never a vague summary figure.",
    image: "/screenshots/grower-command-center.png",
  },
  {
    title: "3. Compliance records",
    department: "Grower",
    body: "Coolstore temperature logs, spray diary entries, and Brix/dry-matter maturity tests — the paper logbooks the industry actually runs on, digitised, with the reference thresholds each record was checked against snapshotted for audit trail.",
    image: "/screenshots/coolstore.png",
  },
  {
    title: "4. Contractor Hub",
    department: "Contractor",
    body: "The contractor's own view: what needs a response right now, what's on today, what's coming up. They accept, start, and complete jobs from here — entering the actual quantity completed, which is what the invoice gets built from.",
    image: "/screenshots/contractor-hub.png",
  },
  {
    title: "5. A job's lifecycle",
    department: "Shared",
    body: "Every job moves through a real status machine — NEW, SCHEDULED, CONFIRMED, IN PROGRESS, COMPLETE, INVOICED — with a full history of who changed it and when. Nothing here is a status label with no trail behind it.",
    image: "/screenshots/job-detail.png",
  },
  {
    title: "6. Auto-invoicing",
    department: "Shared",
    body: "The moment a job is marked complete, the Conductor drafts a GST-correct invoice automatically — no re-keying figures. The invoice carries everything IRD requires on a taxable supply information record: GST numbers, line items, the lot.",
    image: "/screenshots/invoice-detail.png",
  },
  {
    title: "7. Materials ordering",
    department: "Shared",
    body: "Fertiliser, chemicals, packaging, fuel — supplier orders tracked through the same kind of lifecycle as a job: draft, submitted, confirmed, delivered. Suppliers are external contacts, not KiwiFlow accounts, so there's no invoice fabricated on their behalf.",
    image: "/screenshots/material-order-detail.png",
  },
  {
    title: "8. Platform oversight",
    department: "Platform Admin",
    body: "A separate, read-only role for the people running KiwiFlow itself — not something any grower or contractor has. It's the one deliberate exception to every other role's tenant isolation, gated on its own org type, and never reachable through self-service signup.",
    image: "/screenshots/admin-overview.png",
  },
];

export function WalkthroughTour() {
  const [index, setIndex] = useState(0);
  const step = STEPS[index]!;

  return (
    <div className="flex flex-col gap-6">
      {DEPARTMENTS.map((dept) => {
        const deptSteps = STEPS.map((s, i) => ({ s, i })).filter(({ s }) => s.department === dept);
        if (deptSteps.length === 0) return null;
        return (
          <div key={dept}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-kf-muted">{dept}</h3>
            <div className="flex flex-wrap gap-2">
              {deptSteps.map(({ s, i }) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`btn rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    i === index
                      ? "bg-kf-green-600 text-white"
                      : "border border-kf-border text-kf-muted hover:border-kf-green-500 hover:text-kf-charcoal"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1 text-sm font-bold uppercase tracking-wide text-kf-green-600">{step.department}</p>
            <h2 className="text-xl font-semibold text-kf-charcoal">{step.title}</h2>
          </div>
          <p className="text-kf-muted">{step.body}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="btn rounded-md border border-kf-border px-4 py-2 text-sm font-medium text-kf-charcoal hover:border-kf-green-500 disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(STEPS.length - 1, i + 1))}
              disabled={index === STEPS.length - 1}
              className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
          <p className="text-xs text-kf-muted">
            Step {index + 1} of {STEPS.length}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-kf-border bg-kf-card shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={step.image}
            alt={`${step.title} — screenshot of the live app`}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
