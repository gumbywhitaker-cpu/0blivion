import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold text-kf-charcoal">Log in to KiwiFlow</h1>
        <p className="mb-6 text-sm text-kf-muted">Pick up where you left off.</p>
        <LoginForm />
      </div>
    </div>
  );
}
