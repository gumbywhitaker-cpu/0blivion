import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { totpUri } from "@/lib/auth/totp";
import { generateQrDataUrl } from "@/lib/qr";
import { SettingsForm } from "./SettingsForm";
import { MfaSettings } from "./MfaSettings";

export default async function SettingsPage() {
  const session = await requireSession();

  const [org, user, auditLog] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: session.organizationId } }),
    prisma.user.findUniqueOrThrow({ where: { id: session.userId } }),
    prisma.auditLog.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);

  const setupQrDataUrl =
    user.totpSecret && !user.totpEnabled
      ? await generateQrDataUrl(totpUri(user.totpSecret, user.email))
      : null;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-1 text-2xl font-semibold text-kf-charcoal">Organisation settings</h1>
        <p className="mb-6 text-kf-muted">
          These details appear on invoices you issue — keep them accurate for compliant tax invoices.
        </p>
        <SettingsForm
          defaults={{
            name: org.name,
            gstNumber: org.gstNumber ?? "",
            address: org.address ?? "",
            phone: org.phone ?? "",
          }}
        />
      </div>

      <div>
        <h2 className="mb-1 text-xl font-semibold text-kf-charcoal">Two-factor authentication</h2>
        <p className="mb-6 text-kf-muted">
          Adds a second step at login using an authenticator app (Google Authenticator, Authy, 1Password, etc.).
        </p>
        <MfaSettings enabled={user.totpEnabled} setupQrDataUrl={setupQrDataUrl} setupInProgress={!!user.totpSecret && !user.totpEnabled} />
      </div>

      <div>
        <h2 className="mb-1 text-xl font-semibold text-kf-charcoal">Recent security activity</h2>
        <p className="mb-6 text-kf-muted">
          Sign-ins, MFA changes, and other security-relevant events for your organisation.
        </p>
        {auditLog.length === 0 ? (
          <p className="text-sm text-kf-muted">No activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Who</th>
                  <th className="px-4 py-3">Event</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry) => (
                  <tr key={entry.id} className="border-b border-kf-border last:border-0">
                    <td className="px-4 py-3 text-kf-muted">
                      {entry.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                    </td>
                    <td className="px-4 py-3">{entry.actor?.name ?? entry.actor?.email ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{entry.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
