"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ email: "", password: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      const next = params.get("next");
      router.push(!data.hasBusiness ? "/onboarding" : next && next.startsWith("/") ? next : "/app");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h1 className="text-xl font-semibold text-foreground">Log in</h1>
      <p className="mt-1 text-sm text-muted">Good to see you back.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <FormField label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
          />
        </FormField>
        <FormField label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
          />
        </FormField>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex items-center justify-between">
          <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={loading}>
          Log in
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        New to Kiwi Job Cash?{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Create a free account
        </Link>
      </p>
    </Card>
  );
}
