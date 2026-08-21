import Link from "next/link";
import Image from "next/image";
import { WalkthroughTour } from "./WalkthroughTour";

export const metadata = { title: "How it works — KiwiFlow" };

export default function HowItWorksPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-kf-border bg-kf-green-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Image src="/brand/kiwiflow-icon.png" alt="" width={28} height={28} priority />
            KiwiFlow
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/about" className="text-white/80 hover:text-white">
              About
            </Link>
            <Link href="/login" className="text-white/80 hover:text-white">
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-kf-green-600">Guide</p>
        <h1 className="mb-3 text-3xl font-semibold text-kf-charcoal">How KiwiFlow works</h1>
        <p className="mb-10 max-w-2xl text-kf-muted">
          Every screen below is a real screenshot of the live app with its seeded demo data — not a
          mockup. Walk through it in order, or jump to any step.
        </p>

        <WalkthroughTour />
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 py-6 text-xs text-kf-muted">
        KiwiFlow — not affiliated with Zespri Group Limited.
      </footer>
    </div>
  );
}
