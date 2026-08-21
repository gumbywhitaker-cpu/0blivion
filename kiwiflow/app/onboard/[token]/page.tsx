import { prisma } from "@/lib/db";
import { OnboardForm } from "./OnboardForm";

export default async function OnboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.onboardingInvite.findUnique({
    where: { token },
    include: { organization: true },
  });

  const invalid = !invite || invite.status !== "PENDING" || invite.expiresAt < new Date();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-kf-green-900 px-6 py-16 text-white">
      <div className="w-full max-w-sm">
        <p className="mb-1 text-sm font-medium uppercase tracking-widest text-kf-green-500">
          OneTap onboarding
        </p>
        {invalid ? (
          <>
            <h1 className="mb-2 text-2xl font-semibold">This link isn&apos;t valid</h1>
            <p className="text-white/80">
              It may have already been used or expired. Ask{" "}
              {invite?.organization.name ?? "the grower"} to send you a new QR code.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-semibold">
              Join {invite.organization.name} on KiwiFlow
            </h1>
            <p className="mb-6 text-white/80">
              A few details and you&apos;re set up — no paperwork.
            </p>
            <div className="rounded-lg bg-white p-6">
              <OnboardForm token={token} defaultOrgName={invite.contractorName ?? undefined} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
