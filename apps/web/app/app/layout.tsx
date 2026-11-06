import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "../../lib/dal";
import { signOut } from "../../auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--foreground)] selection:text-[var(--background)]">
      {/* Status Ribbon */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-center text-xs font-mono uppercase tracking-wider text-[var(--secondary)]">
        Telegraph Network
      </div>

      {/* Main App Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex w-full items-center justify-between px-6 lg:px-12 py-3.5">
          <div className="flex items-center gap-6">
            <Link href="/app" className="font-semibold text-lg tracking-tight">
              Half-Life
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/app" className="text-[var(--secondary)] hover:text-[var(--foreground)]">
                Overview
              </Link>
              <Link href="/app/agents" className="text-[var(--secondary)] hover:text-[var(--foreground)]">
                Agents
              </Link>
              <Link href="/app/ledger" className="text-[var(--secondary)] hover:text-[var(--foreground)]">
                Ledger
              </Link>
              <Link href="/app/leaderboard" className="text-[var(--secondary)] hover:text-[var(--foreground)] font-medium">
                Leaderboard
              </Link>
              <Link href="/app/decisions" className="text-[var(--secondary)] hover:text-[var(--foreground)]">
                Decisions
              </Link>
              <Link href="/app/benchmarks" className="text-[var(--secondary)] hover:text-[var(--foreground)]">
                Benchmarks
              </Link>
              <Link href="/atlas" className="text-[var(--secondary)] hover:text-[var(--foreground)]">
                Atlas
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/app/admin/users"
                  className="rounded border border-purple-800 bg-purple-50 px-2 py-0.5 text-xs font-mono text-purple-900"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-mono text-[var(--secondary)] hover:text-[var(--foreground)]"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* App Body */}
      <main className="w-full flex-1 px-6 lg:px-12 py-8">
        {children}
      </main>
    </div>
  );
}

