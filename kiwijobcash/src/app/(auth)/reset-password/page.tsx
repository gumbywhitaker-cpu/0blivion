"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordForm />
    </React.Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Card>
        <p className="text-sm text-danger">This reset link is missing a token.</p>
      </Card>
    );
  }

  if (done) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-foreground">Password updated</h1>
        <p className="mt-2 text-sm text-muted">Redirecting you to login…</p>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-xl font-semibold text-foreground">Choose a new password</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <FormField label="New password" htmlFor="password" hint="At least 8 characters.">
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </FormField>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          Update password
        </Button>
      </form>
    </Card>
  );
}
