import { redirect } from "next/navigation";
import { getMfaPendingUserId } from "@/lib/auth/session";
import { VerifyMfaForm } from "./VerifyMfaForm";

export default async function VerifyMfaPage() {
  const pendingUserId = await getMfaPendingUserId();
  if (!pendingUserId) redirect("/login");

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold text-kf-charcoal">Two-factor verification</h1>
        <p className="mb-6 text-sm text-kf-muted">
          Enter the 6-digit code from your authenticator app, or a backup code.
        </p>
        <VerifyMfaForm />
      </div>
    </div>
  );
}
