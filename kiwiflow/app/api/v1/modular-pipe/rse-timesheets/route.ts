import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PACK_VERSION, SCHEMA_VERSION } from "@/lib/modularPipe/types";

// GET /api/v1/modular-pipe/rse-timesheets — Delivery stage JSON API (spec Section 3.1).
// Payroll safety note: pay_rate is only ever what was actually visible on the sheet
// (lib/modularPipe/validate.ts never invents one), and total_hours_computed is always
// the deterministic recalculation, kept alongside total_hours_reported rather than
// silently replacing it.
export async function GET() {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") {
    return Response.json({ error: "Only pack house organisations can use the Data Bridge." }, { status: 403 });
  }

  const rows = await prisma.modularPipeRseTimesheet.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return Response.json({
    source_pack: "packing_house",
    pack_version: PACK_VERSION,
    schema_version: SCHEMA_VERSION,
    rse_timesheets: rows.map((r) => ({
      record_id: r.id,
      document_id: r.documentId,
      timesheet_id: r.timesheetIdRaw,
      worker_id: r.workerIdRaw,
      worker_name: r.workerNameRaw,
      worker_name_normalized: r.workerNameNormalized,
      date: r.date,
      shift_start_time: r.shiftStartTime,
      shift_end_time: r.shiftEndTime,
      breaks: JSON.parse(r.breaksJson),
      tasks: JSON.parse(r.tasksJson),
      total_hours_reported: r.totalHoursReported,
      total_hours_computed: r.totalHoursComputed,
      overtime_hours: r.overtimeHours,
      pay_rate: r.payRate,
      supervisor_id: r.supervisorIdRaw,
      approvals: JSON.parse(r.approvalsJson),
      status: r.status,
    })),
  });
}
