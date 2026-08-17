"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [devUrl, setDevUrl] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setSent(true);
      if (data.devResetUrl) setDevUrl(data.devResetUrl);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted">
          If that email has an account, we&apos;ve sent a link to reset your password.
        </p>
        {devUrl && (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-surface-2 p-3 text-xs">
            <p className="font-medium text-foreground">Dev mode — no email provider configured.</p>
            <Link href={devUrl} className="mt-1 block break-all text-brand underline">
              {devUrl}
            </Link>
          </div>
        )}
        <Button href="/login" variant="outline" className="mt-6" fullWidth>
          Back to login
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <FormField label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </FormField>
        <Button type="submit" fullWidth loading={loading}>
          Send reset link
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-brand hover:underline">
          Back to login
        </Link>
      </p>
    </Card>
  );
}
