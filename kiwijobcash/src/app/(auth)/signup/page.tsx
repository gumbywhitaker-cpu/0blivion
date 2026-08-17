"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export default function SignupPage() {
  return (
    <React.Suspense fallback={null}>
      <SignupForm />
    </React.Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", email: "", password: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      push("Welcome to Kiwi Job Cash!", "success");
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const plan = params.get("plan");

  return (
    <Card>
      <h1 className="text-xl font-semibold text-foreground">Create your free account</h1>
      <p className="mt-1 text-sm text-muted">
        Takes about 60 seconds. No card required
        {plan && plan !== "FREE" ? ` — you'll pick the ${plan.toLowerCase()} plan after.` : "."}
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <FormField label="Your name" htmlFor="name">
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Dave Wilson"
            autoComplete="name"
          />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="dave@example.co.nz"
            autoComplete="email"
          />
        </FormField>
        <FormField label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </FormField>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" fullWidth loading={loading}>
          Create my free account
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-muted">
        By signing up you agree to our{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </Card>
  );
}
