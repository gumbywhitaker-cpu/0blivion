import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

// Payroll-safety note applies here too: Pay Rate is exported exactly as recorded
// (null unless it was actually visible on the sheet), and both the reported and
// computed hours columns are exported side by side rather than picking one.
export async function GET() {
  const session = await requireSession();

  const rows = await prisma.modularPipeRseTimesheet.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    [
      "Timesheet ID",
      "Worker ID",
      "Worker Name",
      "Date",
      "Shift Start",
      "Shift End",
      "Total Hours (reported)",
      "Total Hours (computed)",
      "Overtime Hours",
      "Pay Rate",
      "Supervisor",
      "Status",
    ],
    rows.map((r) => [
      r.timesheetIdRaw ?? "",
      r.workerIdRaw ?? "",
      r.workerNameRaw ?? "",
      r.date ?? "",
      r.shiftStartTime ?? "",
      r.shiftEndTime ?? "",
      r.totalHoursReported ?? "",
      r.totalHoursComputed ?? "",
      r.overtimeHours ?? "",
      r.payRate ?? "",
      r.supervisorIdRaw ?? "",
      r.status,
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kiwiflow-modular-pipe-rse-timesheets-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
