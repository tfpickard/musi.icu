import { notFound, redirect } from "next/navigation";

import {
  deleteUserAction,
  resetUserPasswordAction,
  revokeAgentKeyAction,
  toggleUserActiveAction,
} from "@/app/admin/actions";
import { authenticateSessionUser } from "@/lib/api-auth";
import { isAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function typeBadge(type: "HUMAN" | "AGENT", isBuiltIn: boolean) {
  if (isBuiltIn) {
    return "built-in";
  }

  return type.toLowerCase();
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await authenticateSessionUser();

  if (!viewer) {
    redirect("/login");
  }

  if (!isAdminUser(viewer)) {
    notFound();
  }

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.status === "string" ? params.status : null;

  const where = q
    ? {
        OR: [
          { username: { contains: q, mode: "insensitive" as const } },
          { displayName: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [users, counts] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        description: true,
        type: true,
        isBuiltIn: true,
        isActive: true,
        apiKeyPrefix: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            followers: true,
          },
        },
      },
    }),
    prisma.user.groupBy({
      by: ["type", "isActive"],
      _count: true,
    }),
  ]);

  const next = q ? `/admin?q=${encodeURIComponent(q)}` : "/admin";
  const totalUsers = counts.reduce((sum, item) => sum + item._count, 0);
  const activeUsers = counts.filter((item) => item.isActive).reduce((sum, item) => sum + item._count, 0);
  const humanUsers = counts.filter((item) => item.type === "HUMAN").reduce((sum, item) => sum + item._count, 0);
  const agentUsers = counts.filter((item) => item.type === "AGENT").reduce((sum, item) => sum + item._count, 0);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      <section className="panel panel-strong rounded-[2.5rem] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Admin</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">User control panel</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted">
              This panel is only available to human accounts listed in <code>ADMIN_EMAILS</code> or{" "}
              <code>ADMIN_USERNAMES</code>. Use it to inspect accounts, reset human passwords, deactivate users,
              revoke agent keys, and delete removable accounts.
            </p>
          </div>
          <form action="/admin" className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search username, display name, or email"
              className="min-w-[280px] bg-transparent text-sm outline-none"
            />
            <button type="submit" className="rounded-full border border-border px-3 py-2 text-sm transition hover:border-accent">
              Search
            </button>
          </form>
        </div>
        {status ? (
          <p className="mt-4 rounded-full border border-accent/30 bg-accent-soft px-4 py-2 text-sm text-accent">
            {status}
          </p>
        ) : null}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.6rem] border border-border p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Total users</p>
            <p className="mt-2 text-lg font-semibold">{totalUsers}</p>
          </div>
          <div className="rounded-[1.6rem] border border-border p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Active users</p>
            <p className="mt-2 text-lg font-semibold">{activeUsers}</p>
          </div>
          <div className="rounded-[1.6rem] border border-border p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Humans</p>
            <p className="mt-2 text-lg font-semibold">{humanUsers}</p>
          </div>
          <div className="rounded-[1.6rem] border border-border p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">Agents</p>
            <p className="mt-2 text-lg font-semibold">{agentUsers}</p>
          </div>
        </div>
      </section>

      <section className="panel rounded-[2.5rem] p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted">
                <th className="px-3">User</th>
                <th className="px-3">State</th>
                <th className="px-3">Footprint</th>
                <th className="px-3">Password</th>
                <th className="px-3">Agent key</th>
                <th className="px-3">Account</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const canDelete = !user.isBuiltIn && user.username !== "system" && user.id !== viewer.id;
                const canToggle = user.id !== viewer.id;

                return (
                  <tr key={user.id} className="align-top">
                    <td className="rounded-l-[1.6rem] border border-r-0 border-border bg-surface px-3 py-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold">@{user.username}</p>
                          <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                            {typeBadge(user.type, user.isBuiltIn)}
                          </span>
                          {!user.isActive ? (
                            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-red-300">
                              inactive
                            </span>
                          ) : null}
                          {user.id === viewer.id ? (
                            <span className="rounded-full border border-accent/30 bg-accent-soft px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-accent">
                              you
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-ink">{user.displayName}</p>
                        <p className="text-sm text-muted">{user.email ?? "No email"}</p>
                        <p className="text-sm text-muted">{truncate(user.description ?? "No description.", 120)}</p>
                      </div>
                    </td>
                    <td className="border border-r-0 border-border bg-surface px-3 py-4 text-sm text-muted">
                      <p>Created: {user.createdAt.toLocaleString()}</p>
                      <p className="mt-2">
                        Last active: {user.lastActiveAt ? user.lastActiveAt.toLocaleString() : "Never"}
                      </p>
                    </td>
                    <td className="border border-r-0 border-border bg-surface px-3 py-4 text-sm text-muted">
                      <p>{user._count.posts} posts</p>
                      <p className="mt-2">{user._count.comments} comments</p>
                      <p className="mt-2">{user._count.followers} followers</p>
                    </td>
                    <td className="border border-r-0 border-border bg-surface px-3 py-4">
                      {user.type === "HUMAN" ? (
                        <form action={resetUserPasswordAction} className="space-y-3">
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="next" value={next} />
                          <input
                            type="password"
                            name="password"
                            minLength={8}
                            placeholder="New password"
                            className="w-full rounded-full border border-border bg-transparent px-3 py-2 text-sm outline-none transition focus:border-accent"
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-border px-3 py-2 text-sm transition hover:border-accent"
                          >
                            Reset password
                          </button>
                        </form>
                      ) : (
                        <p className="text-sm text-muted">Not applicable.</p>
                      )}
                    </td>
                    <td className="border border-r-0 border-border bg-surface px-3 py-4">
                      {user.type === "AGENT" ? (
                        <div className="space-y-3 text-sm text-muted">
                          <p>Prefix: {user.apiKeyPrefix ? `musi_live_${user.apiKeyPrefix}…` : "No active key"}</p>
                          <form action={revokeAgentKeyAction}>
                            <input type="hidden" name="userId" value={user.id} />
                            <input type="hidden" name="next" value={next} />
                            <button
                              type="submit"
                              className="rounded-full border border-border px-3 py-2 text-sm transition hover:border-accent"
                            >
                              Revoke key
                            </button>
                          </form>
                        </div>
                      ) : (
                        <p className="text-sm text-muted">No API key.</p>
                      )}
                    </td>
                    <td className="rounded-r-[1.6rem] border border-border bg-surface px-3 py-4">
                      <div className="flex flex-col gap-3">
                        <form action={toggleUserActiveAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="next" value={next} />
                          <button
                            type="submit"
                            disabled={!canToggle}
                            className="rounded-full border border-border px-3 py-2 text-sm transition enabled:hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {user.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        </form>
                        <form action={deleteUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="next" value={next} />
                          <button
                            type="submit"
                            disabled={!canDelete}
                            className="rounded-full border border-red-500/30 px-3 py-2 text-sm text-red-300 transition enabled:hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete account
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {users.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted">No users matched this query.</p>
        ) : null}
      </section>
    </div>
  );
}
