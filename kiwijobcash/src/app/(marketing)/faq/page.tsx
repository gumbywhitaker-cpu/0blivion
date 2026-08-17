import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Kiwi Job Cash.",
};

const FAQS = [
  {
    q: "What is Kiwi Job Cash?",
    a: "Kiwi Job Cash finds revenue you're currently missing — uncontacted leads, forgotten quotes, overdue invoices and dormant customers — and helps you act on it with AI-drafted follow-ups you approve before anything is sent.",
  },
  {
    q: "Is this a CRM or accounting software?",
    a: "No. It's a revenue recovery tool. It tracks leads, quotes, invoices and jobs like a CRM would, but its whole purpose is finding money you're losing and helping you get it back.",
  },
  {
    q: "Does the AI send messages on its own?",
    a: "Never, by default. Every AI-drafted message needs your approval before it's sent, unless you deliberately turn on automated sending in Settings → Automation.",
  },
  {
    q: "How accurate is the Money Leak Scan?",
    a: "It's an estimate based on the numbers you enter, clearly labelled as an estimate — not a guarantee. Once you're using the full product with your real leads, quotes and invoices, the numbers become fully traceable to your own records.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You can export your business data at any time from Settings. If you delete your account, your data is removed according to our Privacy Policy.",
  },
  {
    q: "Do I need to connect my accounting software?",
    a: "No — you can use Kiwi Job Cash entirely on its own, or import a CSV. Xero and other integrations are available for businesses that want to sync data automatically.",
  },
  {
    q: "Is my data shared with other businesses?",
    a: "No. Every business's data is strictly isolated — enforced on the server for every request, not just hidden in the interface.",
  },
  {
    q: "Can my team use it too?",
    a: "Yes — the Crew plan supports multiple users with role-based permissions (Owner, Admin, Manager, Staff, Read Only).",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Frequently asked questions</h1>
      </div>

      <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-surface">
        {FAQS.map((f) => (
          <div key={f.q} className="p-6">
            <p className="font-semibold text-foreground">{f.q}</p>
            <p className="mt-2 text-sm text-muted">{f.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted">Still have questions?</p>
        <Button href="/contact" variant="outline" className="mt-4">
          Contact us
        </Button>
      </div>
    </div>
  );
}
