import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col bg-kf-green-900 text-white">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Image src="/brand/kiwiflow-icon.png" alt="" width={32} height={32} priority />
          KiwiFlow
        </span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn rounded-md px-4 py-2 text-sm font-medium hover:bg-white/10">
            Log in
          </Link>
          <Link
            href="/signup"
            className="btn rounded-md bg-kf-green-500 px-4 py-2 text-sm font-semibold text-kf-green-900 hover:bg-white"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col items-start gap-6">
          <p className="text-sm font-medium uppercase tracking-widest text-kf-green-500">
            Built for the crews in the mud
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            The operational layer for New Zealand kiwifruit.
          </h1>
          <p className="max-w-xl text-lg text-white/80">
            Growers, contractors, crews, transport and pack houses — one shared record of
            what&apos;s scheduled, what&apos;s done, and what&apos;s owed. Enter it once, use it
            everywhere.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/signup"
              className="btn rounded-md bg-kf-green-500 px-6 py-3 text-base font-semibold text-kf-green-900 hover:bg-white"
            >
              Create your organisation
            </Link>
            <Link
              href="/login"
              className="btn rounded-md border border-white/30 px-6 py-3 text-base font-medium hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Image
            src="/brand/kiwiflow-logo-full.png"
            alt="KiwiFlow"
            width={567}
            height={484}
            priority
            className="w-full max-w-sm drop-shadow-2xl"
          />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 py-6 text-xs text-white/50">
        KiwiFlow — not affiliated with Zespri Group Limited.
      </footer>
    </div>
  );
}
