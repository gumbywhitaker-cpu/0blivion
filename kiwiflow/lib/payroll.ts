import { prisma } from "@/lib/db";
import { PAYROLL_COMPLIANCE_WINDOW_WEEKS, MINIMUM_WAGE_REFERENCE_RATES, type MinimumWageType } from "@/lib/types";

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

export type WeeklyTopUpCheck = {
  periodStart: Date;
  periodEnd: Date;
  hoursWorked: number;
  pieceRateEarnings: number;
  minimumWageRate: number;
  requiredMinimum: number;
  shortfall: number;
  alreadyRecorded: boolean;
};

/** Monday 00:00 of the ISO week containing `date`. */
export function startOfIsoWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Weekly minimum-wage check for a piece-rate/mixed worker — the actual
 * wage-floor calculation NZ's Minimum Wage Act requires: hours worked that
 * week x the worker's minimum wage rate, compared against what they
 * actually earned on piece rates that week. A shortfall here is what an
 * operator confirms and pays via recordWageTopUpAction, not an automatic
 * payment — this function only computes, it never writes.
 */
export async function computeWeeklyTopUpCheck(crewMemberId: string, weekStart: Date): Promise<WeeklyTopUpCheck> {
  const periodStart = startOfIsoWeek(weekStart);
  const periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [member, timeEntries, pieceRateRecords, existing] = await Promise.all([
    prisma.crewMember.findUniqueOrThrow({ where: { id: crewMemberId } }),
    prisma.timeEntry.findMany({
      where: { crewMemberId, clockIn: { gte: periodStart, lt: periodEnd }, clockOut: { not: null } },
    }),
    prisma.pieceRateRecord.findMany({
      where: { crewMemberId, recordDate: { gte: periodStart, lt: periodEnd } },
    }),
    prisma.wageTopUp.findUnique({ where: { crewMemberId_periodStart: { crewMemberId, periodStart } } }),
  ]);

  const hoursWorked = timeEntries.reduce(
    (sum, e) => sum + hoursBetween(e.clockIn, e.clockOut as Date, e.breakMinutes),
    0,
  );
  const pieceRateEarnings = pieceRateRecords.reduce((sum, r) => sum + r.amount, 0);
  const minimumWageRate = MINIMUM_WAGE_REFERENCE_RATES[member.minimumWageType as MinimumWageType];
  const requiredMinimum = hoursWorked * minimumWageRate;
  const shortfall = Math.max(0, requiredMinimum - pieceRateEarnings);

  return {
    periodStart,
    periodEnd,
    hoursWorked,
    pieceRateEarnings,
    minimumWageRate,
    requiredMinimum,
    shortfall,
    alreadyRecorded: existing != null,
  };
}
