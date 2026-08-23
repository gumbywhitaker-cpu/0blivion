import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

// GET /api/v1/export/payroll.csv — audit-ready wage/hours record for a
// contractor's own crews. Combines TimeEntry and PieceRateRecord into one
// chronological ledger per crew member, org-scoped like every other export.
export async function GET() {
  const session = await requireSession();

  const members = await prisma.crewMember.findMany({
    where: { crew: { organizationId: session.organizationId } },
    include: {
      timeEntries: { orderBy: { clockIn: "desc" } },
      pieceRateRecords: { orderBy: { recordDate: "desc" } },
      wageTopUps: { orderBy: { periodStart: "desc" } },
      crew: true,
    },
  });

  type Row = {
    memberName: string;
    crewName: string;
    date: string;
    kind: string;
    detail: string;
    amount: string;
  };

  const rows: Row[] = [];
  for (const m of members) {
    for (const e of m.timeEntries) {
      const hours = e.clockOut
        ? Math.max(0, (e.clockOut.getTime() - e.clockIn.getTime()) / 3600000 - e.breakMinutes / 60)
        : null;
      rows.push({
        memberName: m.name,
        crewName: m.crew.name,
        date: e.clockIn.toISOString().slice(0, 10),
        kind: "TIME",
        detail: `${e.clockIn.toISOString().slice(11, 16)}${e.clockOut ? ` - ${e.clockOut.toISOString().slice(11, 16)}` : " (open)"}, ${e.breakMinutes}m break`,
        amount: hours != null && m.hourlyRate ? (hours * m.hourlyRate).toFixed(2) : "",
      });
    }
    for (const r of m.pieceRateRecords) {
      rows.push({
        memberName: m.name,
        crewName: m.crew.name,
        date: r.recordDate.toISOString().slice(0, 10),
        kind: "PIECE_RATE",
        detail: `${r.quantity} ${r.unit} @ $${r.ratePerUnit}`,
        amount: r.amount.toFixed(2),
      });
    }
    for (const t of m.wageTopUps) {
      rows.push({
        memberName: m.name,
        crewName: m.crew.name,
        date: t.periodStart.toISOString().slice(0, 10),
        kind: "MIN_WAGE_TOP_UP",
        detail: `${t.hoursWorked.toFixed(1)}h @ $${t.minimumWageRate.toFixed(2)}/hr required $${t.requiredMinimum.toFixed(2)}, earned $${t.pieceRateEarnings.toFixed(2)}`,
        amount: t.shortfall.toFixed(2),
      });
    }
  }
  rows.sort((a, b) => b.date.localeCompare(a.date));

  const csv = toCsv(
    ["Crew Member", "Crew", "Date", "Type", "Detail", "Amount"],
    rows.map((r) => [r.memberName, r.crewName, r.date, r.kind, r.detail, r.amount]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kiwiflow-payroll-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
