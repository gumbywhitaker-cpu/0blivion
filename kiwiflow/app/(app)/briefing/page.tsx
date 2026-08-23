import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getOrGenerateBriefing } from "@/lib/dailyBriefing";
import { GenerateBriefingButton } from "./GenerateBriefingButton";

export default async function BriefingPage() {
  const session = await requireSession();
  if (session.orgType !== "GROWER" && session.orgType !== "CONTRACTOR") {
    redirect("/dashboard");
  }

  const org = await prisma.organization.findUniqueOrThrow({ where: { id: session.organizationId } });
  const result = await getOrGenerateBriefing(session.organizationId, session.orgType, org.name);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Daily Briefing</h1>
        <p className="text-kf-muted">
          An AI-generated summary of today&apos;s jobs, overdue items, and notifications — a suggestion, not a
          replacement for checking Jobs and Invoices yourself.
        </p>
      </div>

      <section className="rounded-lg border border-kf-border bg-kf-card p-4">
        {"error" in result ? (
          <p className="text-sm text-kf-muted">{result.error}</p>
        ) : (
          <>
            <p className="whitespace-pre-line text-sm text-kf-charcoal">{result.content}</p>
            <p className="mt-3 text-xs text-kf-muted">
              Generated {result.generatedAt.toISOString().slice(0, 16).replace("T", " ")} UTC · {result.modelId}
            </p>
          </>
        )}
      </section>

      <GenerateBriefingButton />
    </div>
  );
}
