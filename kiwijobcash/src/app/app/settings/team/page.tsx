import { prisma } from "@/lib/db";
import { requireBusiness } from "@/lib/session";
import { getPlan } from "@/lib/plans";
import { TeamClient } from "@/components/app/settings/TeamClient";

export default async function TeamSettingsPage() {
  const { business, membership } = await requireBusiness();

  const [members, subscription] = await Promise.all([
    prisma.businessMember.findMany({
      where: { businessId: business.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.subscription.findUnique({ where: { businessId: business.id } }),
  ]);

  const plan = getPlan(subscription?.plan);

  return (
    <TeamClient
      currentUserId={membership.userId}
      userLimit={plan.userLimit}
      planName={plan.name}
      members={members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        status: m.status,
      }))}
    />
  );
}
