import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { totpUri } from "@/lib/auth/totp";
import { generateQrDataUrl } from "@/lib/qr";
import { SettingsForm } from "./SettingsForm";
import { MfaSettings } from "./MfaSettings";

export default async function SettingsPage() {
  const session = await requireSession();

  const [org, user] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: session.organizationId } }),
    prisma.user.findUniqueOrThrow({ where: { id: session.userId } }),
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
    </div>
  );
}
