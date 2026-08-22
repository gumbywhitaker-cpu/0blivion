import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CertificationStatusBadge } from "@/lib/ui/badges";
import { CertificationForm } from "./CertificationForm";

// NZGAP/GLOBALG.A.P. audit-readiness view: the certification record itself,
// plus a count of the underlying evidence KiwiFlow already captures for
// each orchard (spray diary, maturity tests, coolstore logs) so a grower
// can see at a glance whether there's something to actually show an
// auditor, not just a certificate number on file.
export default async function CertificationsPage() {
  const session = await requireSession();
  if (session.orgType !== "GROWER") redirect("/dashboard");

  const orchards = await prisma.orchard.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
    include: {
      certifications: { orderBy: { createdAt: "desc" } },
      _count: { select: { sprayEntries: true, maturityTests: true } },
    },
  });

  const coolstoreLogCount = await prisma.coolstoreTemperatureLog.count({
    where: { organizationId: session.organizationId },
  });

  const now = new Date();
  const expiringSoon = orchards
    .flatMap((o) => o.certifications.map((c) => ({ ...c, orchardName: o.name })))
    .filter((c) => c.status === "CERTIFIED" && c.expiryDate && c.expiryDate.getTime() - now.getTime() < 60 * 24 * 60 * 60 * 1000);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Certifications</h1>
        <p className="text-kf-muted">
          NZGAP/GLOBALG.A.P. records per orchard, plus the audit evidence KiwiFlow already captures for
          each one. An annual on-site audit from a real certification body is still how the certificate
          itself is earned — KiwiFlow doesn&apos;t submit anything on your behalf.
        </p>
      </div>

      {expiringSoon.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-gold">Expiring within 60 days</h2>
          <ul className="flex flex-col gap-2">
            {expiringSoon.map((c) => (
              <li key={c.id} className="rounded-lg border border-kf-gold bg-kf-gold/10 p-3 text-sm">
                <span className="font-semibold text-kf-charcoal">{c.orchardName}</span> — {c.scheme} expires{" "}
                {c.expiryDate?.toISOString().slice(0, 10)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CertificationForm orchards={orchards.map((o) => ({ id: o.id, name: o.name }))} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Per-orchard audit readiness</h2>
        <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
              <tr>
                <th className="px-4 py-3">Orchard</th>
                <th className="px-4 py-3">Certifications</th>
                <th className="px-4 py-3">Spray diary entries</th>
                <th className="px-4 py-3">Maturity tests</th>
              </tr>
            </thead>
            <tbody>
              {orchards.map((o) => (
                <tr key={o.id} className="border-b border-kf-border last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-kf-charcoal">
                    <Link href={`/orchards/${o.id}`} className="hover:underline">
                      {o.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {o.certifications.length === 0 ? (
                      <span className="text-kf-muted">None recorded</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {o.certifications.map((c) => (
                          <div key={c.id} className="flex items-center gap-2">
                            <CertificationStatusBadge status={c.status} />
                            <span>{c.scheme}</span>
                            {c.certificateNumber ? <span className="text-kf-muted">#{c.certificateNumber}</span> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{o._count.sprayEntries}</td>
                  <td className="px-4 py-3">{o._count.maturityTests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-kf-muted">
          Coolstore temperature logs are recorded per organisation, not per orchard: {coolstoreLogCount} on
          file.
        </p>
      </section>
    </div>
  );
}
