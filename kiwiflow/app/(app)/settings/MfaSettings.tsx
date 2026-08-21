"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { startMfaSetupAction, confirmMfaAction, disableMfaAction, type MfaFormState } from "./mfaActions";

function ErrorText({ state }: { state: MfaFormState }) {
  if (!state?.error) return null;
  return (
    <p className="text-sm font-medium text-kf-red" role="alert">
      {state.error}
    </p>
  );
}

function ConfirmSetupForm({ qrDataUrl, onEnabled }: { qrDataUrl: string; onEnabled: (codes: string[]) => void }) {
  const [state, action, pending] = useActionState<MfaFormState, FormData>(confirmMfaAction, undefined);

  // confirmMfaAction's revalidatePath causes the parent server component to
  // re-render with enabled=true almost immediately — if the backup-codes view
  // lived inside this component's own success branch, that re-render would
  // unmount it (MfaSettings switches to DisableForm once enabled=true) before
  // the user ever saw the codes. Hand them up to the parent instead, which
  // keeps showing them until the user explicitly dismisses.
  useEffect(() => {
    if (state?.backupCodes) onEnabled(state.backupCodes);
  }, [state?.backupCodes, onEnabled]);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-kf-border bg-kf-card p-4">
      <p className="text-sm text-kf-charcoal">
        Scan this with your authenticator app, then enter the 6-digit code it shows to confirm setup.
      </p>
      <Image src={qrDataUrl} alt="Scan with your authenticator app" width={200} height={200} unoptimized />
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="mfa-code" className="text-sm font-medium text-kf-charcoal">
            Code
          </label>
          <input
            id="mfa-code"
            name="code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            className="w-32 rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
        >
          {pending ? "Confirming…" : "Confirm & turn on"}
        </button>
      </form>
      <ErrorText state={state} />
    </div>
  );
}

function DisableForm() {
  const [state, action, pending] = useActionState<MfaFormState, FormData>(disableMfaAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-kf-border bg-kf-card p-4">
      <p className="font-semibold text-kf-green-700">Two-factor authentication is on.</p>
      <p className="text-sm text-kf-muted">Enter your password and a current code to turn it off.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="disable-password" className="text-sm font-medium text-kf-charcoal">
            Password
          </label>
          <input
            id="disable-password"
            name="password"
            type="password"
            required
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="disable-code" className="text-sm font-medium text-kf-charcoal">
            Code
          </label>
          <input
            id="disable-code"
            name="code"
            required
            inputMode="numeric"
            className="rounded-md border border-kf-border bg-white px-3 py-2 text-base outline-none focus:border-kf-green-600"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn self-start rounded-md border border-kf-red px-4 py-2 text-sm font-medium text-kf-red hover:bg-kf-red/5 disabled:opacity-60"
      >
        {pending ? "Turning off…" : "Turn off two-factor authentication"}
      </button>
      <ErrorText state={state} />
    </form>
  );
}

function BackupCodesDisplay({ codes, onDismiss }: { codes: string[]; onDismiss: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-kf-green-500 bg-kf-green-100 p-4">
      <p className="font-semibold text-kf-charcoal">Two-factor authentication is on.</p>
      <p className="text-sm text-kf-charcoal">
        Save these backup codes somewhere safe — each works once, and this is the only time they&apos;re shown.
        If you lose your authenticator app, use one of these to sign in instead.
      </p>
      <ul className="grid grid-cols-2 gap-1 rounded-md bg-white p-3 font-mono text-sm">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onDismiss}
        className="btn self-start rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700"
      >
        I&apos;ve saved these
      </button>
    </div>
  );
}

export function MfaSettings({
  enabled,
  setupQrDataUrl,
  setupInProgress,
}: {
  enabled: boolean;
  setupQrDataUrl: string | null;
  setupInProgress: boolean;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);

  if (newBackupCodes) {
    return (
      <BackupCodesDisplay
        codes={newBackupCodes}
        onDismiss={() => {
          setNewBackupCodes(null);
          // enabled/setupQrDataUrl props are stale (confirmMfaAction deliberately
          // skips revalidatePath so it can't race the codes off-screen) — now
          // that the user has dismissed them, fetch the real current state.
          router.refresh();
        }}
      />
    );
  }

  if (enabled) {
    return <DisableForm />;
  }

  if (setupInProgress && setupQrDataUrl) {
    return <ConfirmSetupForm qrDataUrl={setupQrDataUrl} onEnabled={setNewBackupCodes} />;
  }

  return (
    <form
      action={async () => {
        setStarting(true);
        await startMfaSetupAction();
      }}
    >
      <button
        type="submit"
        disabled={starting}
        className="btn rounded-md bg-kf-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kf-green-700 disabled:opacity-60"
      >
        {starting ? "Starting…" : "Set up two-factor authentication"}
      </button>
    </form>
  );
}
