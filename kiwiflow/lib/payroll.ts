import { prisma } from "@/lib/db";
import { PAYROLL_COMPLIANCE_WINDOW_WEEKS } from "@/lib/types";

export type WageSummary = {
  windowWeeks: number;
  windowStart: Date;
  totalHours: number;
  totalPieceRateAmount: number;
  avgHoursPerWeek: number;
  minGuaranteedHoursPerWeek: number | null;
  /** null when the member has no configured threshold to check against. */
  underThreshold: boolean | null;
};

function hoursBetween(clockIn: Date, clockOut: Date, breakMinutes: number): number {
  const rawMinutes = (clockOut.getTime() - clockIn.getTime()) / 60000 - breakMinutes;
  return Math.max(0, rawMinutes) / 60;
}

/**
 * Rolling-window wage/hours summary for one crew member — the "heads-up" side
 * of RSE compliance. Open (not-yet-clocked-out) TimeEntry rows are excluded
 * from totalHours since there's no end time to compute a duration from; they
 * still show up via the caller's own open-entry check if needed.
 */
export async function computeWageSummary(
  crewMemberId: string,
  windowWeeks: number = PAYROLL_COMPLIANCE_WINDOW_WEEKS,
): Promise<WageSummary> {
  const windowStart = new Date(Date.now() - windowWeeks * 7 * 24 * 60 * 60 * 1000);

  const [member, timeEntries, pieceRateRecords] = await Promise.all([
    prisma.crewMember.findUniqueOrThrow({ where: { id: crewMemberId } }),
    prisma.timeEntry.findMany({
      where: { crewMemberId, clockIn: { gte: windowStart }, clockOut: { not: null } },
    }),
    prisma.pieceRateRecord.findMany({
      where: { crewMemberId, recordDate: { gte: windowStart } },
    }),
  ]);

  const totalHours = timeEntries.reduce(
    (sum, e) => sum + hoursBetween(e.clockIn, e.clockOut as Date, e.breakMinutes),
    0,
  );
  const totalPieceRateAmount = pieceRateRecords.reduce((sum, r) => sum + r.amount, 0);
  const avgHoursPerWeek = totalHours / windowWeeks;

  const underThreshold =
    member.minGuaranteedHoursPerWeek != null ? avgHoursPerWeek < member.minGuaranteedHoursPerWeek : null;

  return {
    windowWeeks,
    windowStart,
    totalHours,
    totalPieceRateAmount,
    avgHoursPerWeek,
    minGuaranteedHoursPerWeek: member.minGuaranteedHoursPerWeek,
    underThreshold,
  };
}
