import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "About — KiwiFlow" };

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-kf-border bg-kf-green-900 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Image src="/brand/kiwiflow-icon.png" alt="" width={28} height={28} priority />
            KiwiFlow
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/how-it-works" className="text-white/80 hover:text-white">
              How it works
            </Link>
            <Link href="/login" className="text-white/80 hover:text-white">
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-kf-green-600">About</p>
        <h1 className="mb-6 text-3xl font-semibold text-kf-charcoal">
          One shared record for growers, contractors, and everyone in between.
        </h1>
        <p className="mb-10 text-lg text-kf-muted">
          KiwiFlow is an operations tool for the New Zealand kiwifruit industry — the software layer
          that sits between a grower&apos;s orchard and the contractors, crews, and pack houses who
          work it. It replaces the phone calls, texts, and paper dockets that job scheduling and
          invoicing usually run on with one record everyone can see.
        </p>

        <section className="mb-10 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-kf-charcoal">What it actually does</h2>
          <p className="text-kf-muted">
            Four things, done properly, rather than everything done vaguely:
          </p>
          <ul className="flex flex-col gap-3">
            <li className="rounded-lg border border-kf-border bg-kf-card p-4">
              <p className="font-semibold text-kf-charcoal">Customer database</p>
              <p className="text-sm text-kf-muted">
                Orchards, contractor links, crews — who&apos;s who and who&apos;s allowed to see what.
              </p>
            </li>
            <li className="rounded-lg border border-kf-border bg-kf-card p-4">
              <p className="font-semibold text-kf-charcoal">Job scheduling</p>
              <p className="text-sm text-kf-muted">
                A job moves through a real status lifecycle — scheduled, confirmed, in progress,
                complete — with a full history of who changed what and when.
              </p>
            </li>
            <li className="rounded-lg border border-kf-border bg-kf-card p-4">
              <p className="font-semibold text-kf-charcoal">Invoicing</p>
              <p className="text-sm text-kf-muted">
                Marking a job complete drafts the invoice automatically, with correct GST and the
                details IRD requires on a taxable supply information record.
              </p>
            </li>
            <li className="rounded-lg border border-kf-border bg-kf-card p-4">
              <p className="font-semibold text-kf-charcoal">Materials ordering</p>
              <p className="text-sm text-kf-muted">
                Fertiliser, chemicals, packaging, fuel — supplier orders tracked the same way jobs
                are, from draft through to delivered.
              </p>
            </li>
          </ul>
        </section>

        <section className="mb-10 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-kf-charcoal">Also in the build</h2>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-kf-muted">
            <li>OneTap onboarding — a grower generates a QR code, a contractor scans it and sets up their own account. No forms to chase.</li>
            <li>Compliance records — Brix/dry-matter maturity testing, spray diary entries, and coolstore temperature logs, replacing the paper versions.</li>
            <li>Live weather and a spray-window indicator on the Grower Command Center, from Open-Meteo.</li>
            <li>CSV export for every record type, so anything here can go straight to an accountant or auditor.</li>
            <li>Two-factor authentication and rate-limited logins, because this holds real financial and compliance data.</li>
          </ul>
        </section>

        <section className="mb-10 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-kf-charcoal">What it isn&apos;t</h2>
          <p className="text-kf-muted">
            KiwiFlow isn&apos;t affiliated with Zespri Group Limited, and it doesn&apos;t claim to be
            a Zespri system. It doesn&apos;t connect to Zespri&apos;s Orchard Gate Price data, NZGAP or
            GLOBALG.A.P. certification, or MPI phytosanitary systems — those are real, separately
            governed systems, and reproducing them here would mean guessing at data this app has no
            authorised access to. Where the industry&apos;s real numbers matter (maturity thresholds,
            coolstore ranges), this app snapshots the published reference values it used, rather than
            claiming a live feed to a regulator or exporter that doesn&apos;t exist.
          </p>
        </section>

        <div className="flex flex-wrap gap-3 rounded-lg border border-kf-border bg-kf-card p-6">
          <Link
            href="/how-it-works"
            className="btn rounded-md bg-kf-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-kf-green-700"
          >
            See how it works →
          </Link>
          <Link
            href="/signup"
            className="btn rounded-md border border-kf-border px-5 py-2.5 text-sm font-medium text-kf-charcoal hover:border-kf-green-500"
          >
            Create your organisation
          </Link>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-3xl px-6 py-6 text-xs text-kf-muted">
        KiwiFlow — not affiliated with Zespri Group Limited.
      </footer>
    </div>
  );
}
