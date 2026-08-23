import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { generateQrDataUrl } from "@/lib/qr";
import { InviteForm } from "./InviteForm";
import { suspendLinkAction } from "./actions";

export default async function ContractorsPage() {
  const session = await requireSession();

  if (session.orgType !== "GROWER") {
    return (
      <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
        Contractor management is only available for grower organisations.
      </p>
    );
  }

  const [links, invites] = await Promise.all([
    prisma.contractorLink.findMany({
      where: { growerOrgId: session.organizationId },
      include: { contractorOrg: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.onboardingInvite.findMany({
      where: { organizationId: session.organizationId, status: "PENDING", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteQrCodes = await Promise.all(
    invites.map(async (invite) => ({
      invite,
      url: `${appUrl}/onboard/${invite.token}`,
      qr: await generateQrDataUrl(`${appUrl}/onboard/${invite.token}`),
    })),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Contractors</h1>
        <p className="text-kf-muted">
          OneTap: generate a QR code, hand it to a contractor, they scan and onboard themselves —
          no forms for you to fill out.
        </p>
      </div>

      <section className="rounded-lg border border-kf-border bg-kf-card p-4">
        <h2 className="mb-3 font-semibold text-kf-charcoal">Invite a contractor</h2>
        <InviteForm />
      </section>

      {inviteQrCodes.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Pending invites</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inviteQrCodes.map(({ invite, url, qr }) => (
              <div key={invite.id} className="flex flex-col items-center gap-2 rounded-lg border border-kf-border bg-kf-card p-4 text-center">
                {/* Local, server-generated PNG data URL — no external QR API call. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt={`QR code to onboard ${invite.contractorName ?? "a contractor"}`} className="h-40 w-40" />
                <p className="text-sm font-medium text-kf-charcoal">
                  {invite.contractorName ?? "Unnamed invite"}
                </p>
                <p className="break-all text-xs text-kf-muted">{url}</p>
                <p className="text-xs text-kf-muted">
                  Expires {invite.expiresAt.toISOString().slice(0, 10)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Linked contractors</h2>
        {links.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
            No contractors linked yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-kf-border bg-kf-card">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="border-b border-kf-border text-xs uppercase text-kf-muted">
                <tr>
                  <th className="px-4 py-3">Contractor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} className="border-b border-kf-border last:border-0">
                    <td className="px-4 py-3 font-medium text-kf-charcoal">{link.contractorOrg.name}</td>
                    <td className="px-4 py-3">{link.status}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={suspendLinkAction}>
                        <input type="hidden" name="linkId" value={link.id} />
                        <button type="submit" className="btn text-xs font-medium text-kf-green-600 underline">
                          {link.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
