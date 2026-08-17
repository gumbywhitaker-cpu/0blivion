"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";

export default function ContactPage() {
  const [form, setForm] = React.useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSent(true);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Get in touch</h1>
        <p className="mt-3 text-muted">We reply quickly — usually within a business day.</p>
      </div>

      <Card className="mt-10">
        {sent ? (
          <p className="text-center text-sm text-foreground">
            Thanks — we&apos;ve got your message and will be in touch soon.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name" htmlFor="name">
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </FormField>
              <FormField label="Email" htmlFor="email">
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Subject" htmlFor="subject">
              <Input id="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </FormField>
            <FormField label="Message" htmlFor="message">
              <Textarea id="message" rows={5} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </FormField>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" fullWidth loading={loading}>
              Send message
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
