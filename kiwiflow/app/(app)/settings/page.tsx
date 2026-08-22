import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { totpUri } from "@/lib/auth/totp";
import { generateQrDataUrl } from "@/lib/qr";
import { isXeroConfigured } from "@/lib/xero";
import { isMyobConfigured } from "@/lib/myob";
import { disconnectXeroAction } from "./xeroActions";
import { disconnectMyobAction } from "./myobActions";
import { SettingsForm } from "./SettingsForm";
import { MfaSettings } from "./MfaSettings";
import { MyobCredentialsForm } from "./MyobCredentialsForm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ xero?: string; myob?: string }>;
}) {
  const session = await requireSession();
  const { xero, myob } = await searchParams;

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
        <h2 className="mb-1 text-xl font-semibold text-kf-charcoal">Accounting</h2>
        <p className="mb-4 text-kf-muted">
          Connect Xero to push issued invoices over as draft accounting entries. This is a scaffold — it
          needs the operator&apos;s own Xero Developer app credentials configured on this deployment.
        </p>
        {xero === "connected" ? (
          <p className="mb-3 text-sm font-medium text-kf-green-600">Connected to Xero.</p>
        ) : xero === "error" ? (
          <p className="mb-3 text-sm font-medium text-kf-red">Couldn&apos;t connect to Xero — try again.</p>
        ) : null}
        {!isXeroConfigured() ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-4 text-sm text-kf-muted">
            Xero isn&apos;t configured on this deployment (XERO_CLIENT_ID / XERO_CLIENT_SECRET /
            XERO_REDIRECT_URI aren&apos;t set).
          </p>
        ) : org.xeroTenantId ? (
          <form action={disconnectXeroAction}>
            <button
              type="submit"
              className="btn rounded-md border border-kf-border px-4 py-2 text-sm font-semibold hover:bg-kf-red/10 hover:text-kf-red"
            >
              Disconnect Xero
            </button>
          </form>
        ) : (
          <a
            href="/api/xero/connect"
            className="btn inline-block rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700"
          >
            Connect to Xero
          </a>
        )}
      </div>

      <div>
        <h2 className="mb-1 text-xl font-semibold text-kf-charcoal">MYOB</h2>
        <p className="mb-4 text-kf-muted">
          Connect MYOB AccountRight to push issued invoices over as draft accounting entries. This is a
          scaffold — it needs the operator&apos;s own MYOB Developer app credentials configured on this
          deployment.
        </p>
        {myob === "connected" ? (
          <p className="mb-3 text-sm font-medium text-kf-green-600">Connected to MYOB.</p>
        ) : myob === "error" ? (
          <p className="mb-3 text-sm font-medium text-kf-red">Couldn&apos;t connect to MYOB — try again.</p>
        ) : null}
        {!isMyobConfigured() ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-4 text-sm text-kf-muted">
            MYOB isn&apos;t configured on this deployment (MYOB_CLIENT_ID / MYOB_CLIENT_SECRET /
            MYOB_REDIRECT_URI aren&apos;t set).
          </p>
        ) : org.myobCompanyFileUid ? (
          <div className="flex flex-col gap-4">
            <form action={disconnectMyobAction}>
              <button
                type="submit"
                className="btn rounded-md border border-kf-border px-4 py-2 text-sm font-semibold hover:bg-kf-red/10 hover:text-kf-red"
              >
                Disconnect MYOB
              </button>
            </form>
            <MyobCredentialsForm hasCredentials={Boolean(org.myobCfUsername)} />
          </div>
        ) : (
          <a
            href="/api/myob/connect"
            className="btn inline-block rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700"
          >
            Connect to MYOB
          </a>
        )}
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
