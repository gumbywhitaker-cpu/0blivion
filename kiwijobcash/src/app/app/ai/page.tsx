import { requireBusiness } from "@/lib/session";
import { AskKiwiChat } from "@/components/app/ai/AskKiwiChat";

export const metadata = { title: "Ask Kiwi" };

export default async function AskKiwiPage() {
  await requireBusiness();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Ask Kiwi</h1>
        <p className="mt-1 text-muted">Your AI business manager — answers straight from your data.</p>
      </div>
      <AskKiwiChat />
    </div>
  );
}
