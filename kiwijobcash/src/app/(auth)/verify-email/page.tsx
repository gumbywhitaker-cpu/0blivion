"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InlineSpinner } from "@/components/ui/States";

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={null}>
      <VerifyEmailInner />
    </React.Suspense>
  );
}

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = React.useState<"loading" | "ok" | "error">(
    token ? "loading" : "error"
  );

  React.useEffect(() => {
    if (!token) return;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => setStatus(res.ok ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <Card>
      <h1 className="text-xl font-semibold text-foreground">Verify your email</h1>
      <div className="mt-4">
        {status === "loading" && <InlineSpinner label="Verifying…" />}
        {status === "ok" && (
          <p className="text-sm text-brand">Your email is verified. You&apos;re all set.</p>
        )}
        {status === "error" && (
          <p className="text-sm text-danger">
            This link is invalid or has expired. Request a new one from your account
            settings.
          </p>
        )}
      </div>
      <Button href="/app" variant="outline" className="mt-6" fullWidth>
        Go to my dashboard
      </Button>
    </Card>
  );
}
