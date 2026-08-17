import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Kiwi Job Cash collects, uses and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: this is a working draft — get in touch if you have questions.</p>

      <div className="prose-sm mt-10 space-y-8 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">What we collect</h2>
          <p className="mt-2 text-muted">
            When you use Kiwi Job Cash we collect account information (name, email), business
            information you enter (customers, leads, quotes, invoices, jobs, expenses), and usage
            data (feature usage, AI action activity) so the product works and improves.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Money Leak Scan</h2>
          <p className="mt-2 text-muted">
            Figures entered into the free Money Leak Scan (revenue, job value, enquiry counts) are
            stored to generate your estimate and, if you provide an email, to follow up about your
            results. We never sell this information.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">How we use your data</h2>
          <p className="mt-2 text-muted">
            Your business data is used to run the product for you — computing money at risk,
            generating AI action suggestions, and showing your dashboard. We do not use one
            business&apos;s data to serve another business.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">AI processing</h2>
          <p className="mt-2 text-muted">
            When AI features are used, only the data relevant to the specific request (e.g. one
            lead, one quote) is sent for processing — never your entire database. If you haven&apos;t
            configured an AI provider, the product falls back to deterministic, non-AI logic.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Data export and deletion</h2>
          <p className="mt-2 text-muted">
            You can export your business data or delete your account at any time from Settings.
            Deleting your account removes your business data from active systems; some records may
            be retained where required for legal, security or audit purposes.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Third parties</h2>
          <p className="mt-2 text-muted">
            We use third-party services for hosting, email delivery, payments and (optionally) AI
            processing. Each only receives the data necessary to perform its function.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="mt-2 text-muted">
            Questions about this policy? Reach us via the{" "}
            <a href="/contact" className="text-brand hover:underline">
              contact page
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
