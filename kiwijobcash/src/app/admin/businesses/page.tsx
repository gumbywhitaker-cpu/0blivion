import Link from "next/link";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { Card } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Businesses — Admin" };

export default async function AdminBusinessesPage() {
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { email: true, name: true } },
      subscription: true,
      _count: { select: { customers: true, members: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Businesses</h1>
        <p className="mt-1 text-muted">{businesses.length} total, including demo sessions.</p>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Customers</th>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => {
                const plan = getPlan(b.subscription?.plan);
                return (
                  <tr key={b.id} className="border-t border-border hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <Link href={`/admin/businesses/${b.id}`} className="font-medium text-foreground hover:underline">
                        {b.name}
                      </Link>
                      {b.isDemo && (
                        <Badge tone="neutral" className="ml-2">
                          Demo
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{b.owner.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone="brand">{plan.name}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.subscription?.status ?? "ACTIVE"} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-foreground">{b._count.customers}</td>
                    <td className="px-4 py-3 tabular-nums text-foreground">{b._count.members}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(b.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
