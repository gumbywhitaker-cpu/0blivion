import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { COOLSTORE_REFERENCE_RANGE_C } from "@/lib/types";
import { CoolstoreLogForm } from "./CoolstoreLogForm";

export default async function CoolstorePage() {
  const session = await requireSession();

  const logs = await prisma.coolstoreTemperatureLog.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { loggedAt: "desc" },
    take: 100,
    include: { recordedBy: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Coolstore temperature log</h1>
        <p className="text-kf-muted">
          Reference safe range for kiwifruit storage: {COOLSTORE_REFERENCE_RANGE_C.min}°C to{" "}
          {COOLSTORE_REFERENCE_RANGE_C.max}°C. A reading outside that range fires a critical alert
          to your owners immediately.
        </p>
      </div>

      <CoolstoreLogForm />

      {logs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
          No readings logged yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
              <tr>
                <th className="px-4 py-3">Logged</th>
                <th className="px-4 py-3">Facility</th>
                <th className="px-4 py-3">Temp</th>
                <th className="px-4 py-3">Humidity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">By</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-kf-border last:border-0">
                  <td className="px-4 py-3">{log.loggedAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                  <td className="px-4 py-3">{log.facilityName}</td>
                  <td className="px-4 py-3">{log.temperatureC.toFixed(1)}°C</td>
                  <td className="px-4 py-3">{log.humidityPercent ? `${log.humidityPercent.toFixed(0)}%` : "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        log.withinRange ? "bg-kf-green-100 text-kf-green-700" : "bg-kf-red/10 text-kf-red"
                      }`}
                    >
                      {log.withinRange ? "OK" : "OUT OF RANGE"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{log.recordedBy.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
