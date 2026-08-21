import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const session = await requireSession();

  const org = await prisma.organization.findUniqueOrThrow({ where: { id: session.organizationId } });

  return (
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
  );
}
