import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { computeWageSummary, computeWeeklyTopUpCheck, startOfIsoWeek } from "@/lib/payroll";
import { TimeEntryForm } from "./TimeEntryForm";
import { PieceRateForm } from "./PieceRateForm";
import { WageTopUpForm } from "./WageTopUpForm";

function formatHours(h: number) {
  return `${h.toFixed(1)} hrs`;
}

export default async function CrewMemberPayrollPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; memberId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await requireSession();
  const { id: crewId, memberId } = await params;
  const { week } = await searchParams;

  const member = await prisma.crewMember.findFirst({
    where: { id: memberId, crewId, crew: { organizationId: session.organizationId } },
  });
  if (!member) notFound();

  const requestedWeek = week ? new Date(week) : new Date();
  const weekStart = startOfIsoWeek(Number.isNaN(requestedWeek.getTime()) ? new Date() : requestedWeek);

  const [timeEntries, pieceRateRecords, wageTopUps, summary, topUpCheck] = await Promise.all([
    prisma.timeEntry.findMany({ where: { crewMemberId: memberId }, orderBy: { clockIn: "desc" }, take: 20 }),
    prisma.pieceRateRecord.findMany({ where: { crewMemberId: memberId }, orderBy: { recordDate: "desc" }, take: 20 }),
    prisma.wageTopUp.findMany({ where: { crewMemberId: memberId }, orderBy: { periodStart: "desc" }, take: 20 }),
    computeWageSummary(memberId),
    computeWeeklyTopUpCheck(memberId, weekStart),
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

      <section
        className={`rounded-lg border p-4 ${
          topUpCheck.shortfall > 0 ? "border-kf-red bg-kf-red/5" : "border-kf-border bg-kf-card"
        }`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-kf-charcoal">Weekly minimum-wage check</h2>
          <form method="GET" className="flex items-center gap-2 text-sm">
            <label htmlFor="week" className="text-kf-muted">
              Week of
            </label>
            <input
              id="week"
              name="week"
              type="date"
              defaultValue={weekStart.toISOString().slice(0, 10)}
              className="rounded-md border border-kf-border bg-white px-2 py-1 text-sm"
            />
            <button type="submit" className="rounded-md border border-kf-border px-3 py-1 text-sm hover:bg-kf-green-100">
              Go
            </button>
          </form>
        </div>
        <p className="mb-3 text-xs text-kf-muted">
          {topUpCheck.periodStart.toISOString().slice(0, 10)} – {new Date(topUpCheck.periodEnd.getTime() - 1).toISOString().slice(0, 10)}
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <div className="text-kf-muted">Hours worked</div>
            <div className="text-lg font-semibold text-kf-charcoal">{formatHours(topUpCheck.hoursWorked)}</div>
          </div>
          <div>
            <div className="text-kf-muted">Piece-rate earnings</div>
            <div className="text-lg font-semibold text-kf-charcoal">${topUpCheck.pieceRateEarnings.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-kf-muted">Required (${topUpCheck.minimumWageRate.toFixed(2)}/hr)</div>
            <div className="text-lg font-semibold text-kf-charcoal">${topUpCheck.requiredMinimum.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-kf-muted">Shortfall</div>
            <div className={`text-lg font-semibold ${topUpCheck.shortfall > 0 ? "text-kf-red" : "text-kf-green-600"}`}>
              ${topUpCheck.shortfall.toFixed(2)}
            </div>
          </div>
        </div>
        {topUpCheck.shortfall > 0 && !topUpCheck.alreadyRecorded ? (
          <div className="mt-4">
            <p className="mb-2 text-sm text-kf-red">
              Piece-rate earnings this week fell short of the {topUpCheck.minimumWageRate.toFixed(2)}
              /hr reference rate. Confirming records a ${topUpCheck.shortfall.toFixed(2)} top-up payment.
            </p>
            <WageTopUpForm crewMemberId={member.id} weekStart={weekStart.toISOString().slice(0, 10)} />
          </div>
        ) : topUpCheck.alreadyRecorded ? (
          <p className="mt-3 text-sm font-medium text-kf-green-600">Top-up already recorded for this week.</p>
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

      {wageTopUps.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-kf-charcoal">Recorded minimum-wage top-ups</h3>
          <ul className="divide-y divide-kf-border rounded-lg border border-kf-border bg-kf-card text-sm">
            {wageTopUps.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-2">
                <span>
                  Week of {t.periodStart.toISOString().slice(0, 10)} — {formatHours(t.hoursWorked)} @ $
                  {t.minimumWageRate.toFixed(2)}/hr
                </span>
                <span className="font-semibold text-kf-charcoal">${t.shortfall.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
