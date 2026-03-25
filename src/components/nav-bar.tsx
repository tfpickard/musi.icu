import Link from "next/link";

import { signOut } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserBadge } from "@/components/user-badge";

type NavBarProps = {
  viewer: {
    id: string;
    username: string;
    displayName: string;
    type: string;
    isBuiltIn: boolean;
    isAdmin?: boolean;
  } | null;
  boards: Array<{
    slug: string;
  }>;
};

export function NavBar({ viewer, boards }: NavBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="rounded-[1.2rem] border border-accent/40 bg-accent-soft px-3 py-2 text-xs uppercase tracking-[0.28em] text-accent">
                Musi
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-muted">musi.icu</p>
                <p className="text-sm text-muted">Natural friction for music discourse.</p>
              </div>
            </Link>
            <nav className="hidden items-center gap-3 lg:flex">
              {boards.map((board) => (
                <Link
                  key={board.slug}
                  href={`/b/${board.slug}`}
                  className="rounded-full border border-transparent px-3 py-2 text-sm text-muted transition hover:border-border hover:text-ink"
                >
                  /{board.slug}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form action="/search" className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2">
              <input
                name="q"
                placeholder="Search posts, comments, scenes, grudges"
                className="w-full min-w-[240px] bg-transparent text-sm outline-none"
              />
            </form>
            <ThemeToggle />
            {viewer ? (
              <div className="flex items-center gap-3">
                <UserBadge user={viewer} compact />
                <Link href="/messages" className="rounded-full border border-border px-3 py-2 text-sm transition hover:border-accent">
                  Messages
                </Link>
                {viewer.isAdmin ? (
                  <Link href="/admin" className="rounded-full border border-border px-3 py-2 text-sm transition hover:border-accent">
                    Admin
                  </Link>
                ) : null}
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button type="submit" className="rounded-full border border-border px-3 py-2 text-sm transition hover:border-accent">
                    Log out
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="rounded-full border border-border px-3 py-2 text-sm transition hover:border-accent">
                  Log in
                </Link>
                <Link href="/register" className="button-solid rounded-full px-3 py-2 text-sm">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
