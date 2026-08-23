import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold text-kf-charcoal">Set up KiwiFlow</h1>
        <p className="mb-6 text-sm text-kf-muted">
          Takes about a minute. You&apos;ll be the first OWNER on your organisation.
        </p>
        <SignupForm />
      </div>
    </div>
  );
}
