import { Suspense } from "react";
import { signIn } from "../../auth";
import Link from "next/link";

interface LoginFormProps {
  searchParams: Promise<{ error?: string }>;
}

async function LoginForm({ searchParams }: LoginFormProps) {
  const { error } = await searchParams;

  const errorMessages: Record<string, string> = {
    OAuthAccountNotLinked: "This email is already associated with another account.",
    AccessDenied: "Access was denied. Please ensure your Google email is verified.",
    Configuration: "There is an issue with the authentication service configuration.",
    Default: "An error occurred during authentication. Please try again.",
  };

  const errorMessage = error ? errorMessages[error] ?? errorMessages.Default : null;

  return (
    <>
      {errorMessage && (
        <div className="mt-4 rounded border border-[var(--error)] bg-red-50 p-3 text-xs text-[var(--error)]" role="alert">
          {errorMessage}
        </div>
      )}

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/app" });
        }}
        className="mt-6 flex flex-col gap-4"
      >
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded border border-[var(--border-strong)] bg-[var(--foreground)] px-4 py-2.5 text-sm font-medium text-[var(--background)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-strong)]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>
      </form>
    </>
  );
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 py-12 text-[var(--foreground)] selection:bg-[var(--foreground)] selection:text-[var(--background)]">
      <div className="w-full max-w-sm rounded border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="flex flex-col gap-2 text-center">
          <Link href="/" className="font-mono text-xs text-[var(--secondary)] hover:underline">
            &larr; Back to Half-Life
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm leading-relaxed text-[var(--secondary)]">
            Use your Google account. New here? The same button creates your account.
          </p>
        </div>

        <Suspense fallback={<div className="mt-6 text-center text-xs text-[var(--secondary)]">Loading...</div>}>
          <LoginForm searchParams={searchParams} />
        </Suspense>

        <div className="mt-6 border-t border-[var(--border)] pt-4 text-center">
          <p className="text-[11px] font-mono text-[var(--secondary)]">
            Testnet only. No real funds.
          </p>
          <div className="mt-2 flex justify-center gap-4 text-xs text-[var(--secondary)]">
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
