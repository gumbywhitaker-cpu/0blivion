import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Kiwi Job Cash.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted">Last updated: this is a working draft — get in touch if you have questions.</p>

      <div className="prose-sm mt-10 space-y-8 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">Using Kiwi Job Cash</h2>
          <p className="mt-2 text-muted">
            By creating an account you agree to use Kiwi Job Cash for lawful business purposes and to
            keep your login credentials secure. You&apos;re responsible for the accuracy of the data you
            enter.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Estimates, not guarantees</h2>
          <p className="mt-2 text-muted">
            The Money Leak Scan, Money Recovery Score, and any AI-generated estimate are illustrative
            calculations based on the data available. They are not a promise of revenue, savings, or
            business outcomes.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">AI-generated content</h2>
          <p className="mt-2 text-muted">
            AI-drafted messages are suggestions. You are responsible for reviewing and approving any
            message before it is sent to a customer, unless you have explicitly enabled automated
            sending in Settings.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Subscriptions and billing</h2>
          <p className="mt-2 text-muted">
            Paid plans are billed monthly in advance. You can upgrade, downgrade or cancel at any time
            from Settings → Billing. Cancelling stops future billing; your plan remains active until
            the end of the current billing period.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Data ownership</h2>
          <p className="mt-2 text-muted">
            You own the business data you enter. We provide tools to export or delete it at any time.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Changes to these terms</h2>
          <p className="mt-2 text-muted">
            We may update these terms as the product evolves. Material changes will be communicated
            via email or in-app notice.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="mt-2 text-muted">
            Questions about these terms? Reach us via the{" "}
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
