import "server-only";
import { prisma } from "@/lib/db";
import { notifyOrgOwners } from "@/lib/notify";

const WARNING_WINDOW_DAYS = 30;
const RE_WARN_AFTER_DAYS = 7;
const URGENT_WITHIN_DAYS = 7;

/**
 * Certification records track an expiryDate but nothing was proactively
 * surfacing it before this — a grower only found out when they happened to
 * check the audit-readiness page. No cron/background-job infra exists in
 * this repo, so this runs on read: called once per grower page load (see
 * app/(app)/layout.tsx) and re-warns at most weekly per certification via
 * expiryWarnedAt, so it's cheap on the common "nothing due" path and never
 * spams on every request during the warning window.
 */
export async function checkCertificationExpiries(organizationId: string): Promise<void> {
  const now = new Date();
  const warningCutoff = new Date(now.getTime() + WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const reWarnCutoff = new Date(now.getTime() - RE_WARN_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const dueCertifications = await prisma.certification.findMany({
    where: {
      status: "CERTIFIED",
      expiryDate: { lte: warningCutoff },
      orchard: { organizationId },
      OR: [{ expiryWarnedAt: null }, { expiryWarnedAt: { lt: reWarnCutoff } }],
    },
    include: { orchard: true },
  });

  for (const cert of dueCertifications) {
    if (!cert.expiryDate) continue;
    const daysUntilExpiry = Math.ceil((cert.expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const schemeLabel = cert.scheme === "GLOBALGAP" ? "GLOBALG.A.P." : cert.scheme;
    const whenPhrase = daysUntilExpiry < 0 ? "has already expired" : daysUntilExpiry === 0 ? "expires today" : `expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`;

    await notifyOrgOwners({
      organizationId,
      title: `${schemeLabel} certification ${whenPhrase.includes("expired") ? "has expired" : "expiring soon"} — ${cert.orchard.name}`,
      body: `${schemeLabel} certification for ${cert.orchard.name} ${whenPhrase} (${cert.expiryDate.toISOString().slice(0, 10)}). Renew before the audit-readiness view flags it as a gap.`,
      urgency: daysUntilExpiry <= URGENT_WITHIN_DAYS ? "URGENT" : "NORMAL",
    });

    await prisma.certification.update({ where: { id: cert.id }, data: { expiryWarnedAt: now } });
  }
}
