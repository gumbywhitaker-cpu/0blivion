import type { Metadata } from "next";
import { Lock, Shield, Users, Database, KeyRound, FileWarning } from "lucide-react";

export const metadata: Metadata = {
  title: "Security",
  description: "How Kiwi Job Cash protects your business data — tenant isolation, authentication, and secure practices.",
};

const ITEMS = [
  {
    icon: Users,
    title: "Strict tenant isolation",
    body: "Every record belongs to one business. Every query — on every page and every API route — is scoped server-side to your business, never trusted from the browser.",
  },
  {
    icon: KeyRound,
    title: "Role-based permissions",
    body: "Owner, Admin, Manager, Staff and Read Only roles control what each team member can see and do, enforced on the server, not just hidden in the UI.",
  },
  {
    icon: Lock,
    title: "Secure authentication",
    body: "Passwords are hashed with bcrypt. Sessions use signed, HTTP-only cookies. We never store passwords in plain text.",
  },
  {
    icon: Database,
    title: "Your data stays yours",
    body: "Export your business data at any time. Delete your account and we remove your data according to our Privacy Policy.",
  },
  {
    icon: Shield,
    title: "Secrets stay server-side",
    body: "API keys and integration credentials are never exposed to the browser or committed to source control.",
  },
  {
    icon: FileWarning,
    title: "Audit logging",
    body: "Key actions across your business are logged so you can see who did what, and when.",
  },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Security</h1>
        <p className="mt-3 text-muted">
          We built Kiwi Job Cash to handle real business data — customers, quotes, invoices — so
          it&apos;s built with tenant isolation and access control from the ground up.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand-dark">
              <item.icon className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-muted">
        <p>
          We don&apos;t claim compliance with a legal or industry framework we haven&apos;t verified. If your
          business has specific compliance requirements, get in touch and we&apos;ll be upfront about
          what we do and don&apos;t support today.
        </p>
      </div>
    </div>
  );
}
