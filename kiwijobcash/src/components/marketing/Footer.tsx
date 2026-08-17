import Link from "next/link";
import { Logo } from "@/components/Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/money-leak-scan", label: "Money Leak Scan" },
      { href: "/demo", label: "Try the demo" },
    ],
  },
  {
    title: "Industries",
    links: [
      { href: "/industries/plumbers", label: "Plumbers" },
      { href: "/industries/electricians", label: "Electricians" },
      { href: "/industries/builders", label: "Builders" },
      { href: "/industries", label: "All industries" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/security", label: "Security" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/help", label: "Help centre" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <Logo />
            <p className="mt-3 max-w-[220px] text-sm text-muted">
              Find the money you&apos;re losing. Your AI revenue-recovery manager
              for small business.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-foreground">{col.title}</p>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Kiwi Job Cash. Made for NZ small business.</p>
          <p>Wellington, New Zealand</p>
        </div>
      </div>
    </footer>
  );
}
