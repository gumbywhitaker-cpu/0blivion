import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AddMemberForm } from "./AddMemberForm";

export default async function CrewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  const crew = await prisma.crew.findFirst({
    where: { id, organizationId: session.organizationId },
    include: { members: { orderBy: { createdAt: "asc" } } },
  });
  if (!crew) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-kf-charcoal">{crew.name}</h1>

      <section className="rounded-lg border border-kf-border bg-kf-card p-4">
        <h2 className="mb-3 font-semibold text-kf-charcoal">Add a crew member</h2>
        <AddMemberForm crewId={crew.id} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-kf-charcoal">Members</h2>
        {crew.members.length === 0 ? (
          <p className="rounded-lg border border-dashed border-kf-border bg-kf-card p-6 text-kf-muted">
            No members yet.
          </p>
        ) : (
          <ul className="divide-y divide-kf-border rounded-lg border border-kf-border bg-kf-card">
            {crew.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-3">
                <Link href={`/crews/${crew.id}/members/${m.id}`} className="font-medium text-kf-green-600 hover:underline">
                  {m.name}
                </Link>
                <span className="flex items-center gap-3 text-sm text-kf-muted">
                  {m.isRse ? <span className="rounded bg-kf-green-100 px-2 py-0.5 text-xs font-semibold text-kf-green-700">RSE</span> : null}
                  <span>{m.employmentType.replace("_", " ")}</span>
                  <span>{m.phone ?? "—"}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
