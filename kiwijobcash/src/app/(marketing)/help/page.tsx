import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BookOpen, MessageCircle, Lightbulb } from "lucide-react";

export const metadata: Metadata = {
  title: "Help Centre",
  description: "Get help with Kiwi Job Cash — FAQ, contact support, or send feedback.",
};

const LINKS = [
  {
    icon: BookOpen,
    title: "Frequently asked questions",
    body: "Common questions about pricing, AI actions, data privacy and more.",
    href: "/faq",
  },
  {
    icon: MessageCircle,
    title: "Contact support",
    body: "Get in touch and we'll reply within a business day.",
    href: "/contact",
  },
  {
    icon: Lightbulb,
    title: "Feature requests",
    body: "Tell us what would make Kiwi Job Cash more useful for your business.",
    href: "/contact",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Help centre</h1>
        <p className="mt-3 text-muted">How can we help?</p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {LINKS.map((l) => (
          <Link
            key={l.title}
            href={l.href}
            className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 hover:border-brand"
          >
            <l.icon className="size-6 text-brand" />
            <div>
              <p className="font-semibold text-foreground">{l.title}</p>
              <p className="mt-1 text-sm text-muted">{l.body}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button href="/contact">Contact us</Button>
      </div>
    </div>
  );
}
