import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { IngestForm } from "../IngestForm";

export default async function ModularPipeIngestPage() {
  const session = await requireSession();
  if (session.orgType !== "PACKHOUSE") redirect("/dashboard");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-kf-charcoal">Ingest a document</h1>
        <p className="text-kf-muted">
          Paste text or upload a photo of a quality log, bin ticket, or RSE timesheet. It&apos;s classified,
          extracted, and validated immediately — anything ambiguous is flagged, never guessed.
        </p>
      </div>
      <IngestForm />
    </div>
  );
}
