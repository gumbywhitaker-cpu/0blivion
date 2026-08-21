import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { computeWageSummary } from "@/lib/payroll";
import { TimeEntryForm } from "./TimeEntryForm";
import { PieceRateForm } from "./PieceRateForm";

function formatHours(h: number) {
  return `${h.toFixed(1)} hrs`;
}

export default async function CrewMemberPayrollPage({
  params,
}: {
  params: Promise<{ id: string; memberId: string }>;
}) {
  const session = await requireSession();
  const { id: crewId, memberId } = await params;

  const member = await prisma.crewMember.findFirst({
    where: { id: memberId, crewId, crew: { organizationId: session.organizationId } },
  });
  if (!member) notFound();

  const [timeEntries, pieceRateRecords, summary] = await Promise.all([
    prisma.timeEntry.findMany({ where: { crewMemberId: memberId }, orderBy: { clockIn: "desc" }, take: 20 }),
    prisma.pieceRateRecord.findMany({ where: { crewMemberId: memberId }, orderBy: { recordDate: "desc" }, take: 20 }),
    computeWageSummary(memberId),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={`/crews/${crewId}`} className="text-sm text-kf-green-600 hover:underline">
          ← Back to crew
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-kf-charcoal">{member.name}</h1>
        <p className="text-kf-muted">
          {member.employmentType.replace("_", " ")}
          {member.isRse ? " · RSE worker" : ""}
          {member.hourlyRate ? ` · $${member.hourlyRate.toFixed(2)}/hr` : ""}
        </p>
      </div>

      <section
        className={`rounded-lg border p-4 ${
          summary.underThreshold ? "border-kf-red bg-kf-red/5" : "border-kf-border bg-kf-card"
        }`}
      >
        <h2 className="mb-2 font-semibold text-kf-charcoal">
          Last {summary.windowWeeks} weeks
        </h2>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <div className="text-kf-muted">Hours worked</div>
            <div className="text-lg font-semibold text-kf-charcoal">{formatHours(summary.totalHours)}</div>
          </div>
          <div>
            <div className="text-kf-muted">Avg / week</div>
            <div className="text-lg font-semibold text-kf-charcoal">{formatHours(summary.avgHoursPerWeek)}</div>
          </div>
          <div>
            <div className="text-kf-muted">Piece-rate earnings</div>
            <div className="text-lg font-semibold text-kf-charcoal">
              ${summary.totalPieceRateAmount.toFixed(2)}
            </div>
          </div>
          {summary.minGuaranteedHoursPerWeek != null ? (
            <div>
              <div className="text-kf-muted">Min guaranteed hrs/week</div>
              <div className="text-lg font-semibold text-kf-charcoal">{summary.minGuaranteedHoursPerWeek}</div>
            </div>
          ) : null}
        </div>
        {summary.underThreshold ? (
          <p className="mt-3 text-sm font-medium text-kf-red">
            Below the configured minimum guaranteed hours for this worker over this window. This is a
            heads-up from the operator-entered threshold, not a legal determination — verify against the
            actual RSE Agreement to Recruit and current MBIE policy before acting on it.
          </p>
        ) : null}
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="rounded-lg border border-kf-border bg-kf-card p-4">
            <h2 className="mb-3 font-semibold text-kf-charcoal">Log time</h2>
            <TimeEntryForm crewMemberId={member.id} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-kf-charcoal">Recent entries</h3>
            {timeEntries.length === 0 ? (
              <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-4 text-sm text-kf-muted">
                No time entries yet.
              </p>
            ) : (
              <ul className="divide-y divide-kf-border rounded-lg border border-kf-border bg-kf-card text-sm">
                {timeEntries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between px-4 py-2">
                    <span>
                      {e.clockIn.toISOString().slice(0, 16).replace("T", " ")}
                      {e.clockOut ? ` → ${e.clockOut.toISOString().slice(11, 16)}` : " (open)"}
                    </span>
                    <span className="text-kf-muted">{e.breakMinutes}m break</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="rounded-lg border border-kf-border bg-kf-card p-4">
            <h2 className="mb-3 font-semibold text-kf-charcoal">Log piece-rate output</h2>
            <PieceRateForm crewMemberId={member.id} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-kf-charcoal">Recent records</h3>
            {pieceRateRecords.length === 0 ? (
              <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-4 text-sm text-kf-muted">
                No piece-rate records yet.
              </p>
            ) : (
              <ul className="divide-y divide-kf-border rounded-lg border border-kf-border bg-kf-card text-sm">
                {pieceRateRecords.map((r) => (
                  <li key={r.id} className="flex items-center justify-between px-4 py-2">
                    <span>
                      {r.recordDate.toISOString().slice(0, 10)} — {r.quantity} {r.unit} @ ${r.ratePerUnit}
                    </span>
                    <span className="font-semibold text-kf-charcoal">${r.amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
