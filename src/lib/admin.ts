import type { User } from "@/generated/prisma/client";
import { authenticateSessionUser } from "@/lib/api-auth";

function parseAdminList(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminUser(
  user:
    | Pick<User, "id" | "email" | "username" | "type" | "isActive">
    | null
    | undefined,
) {
  if (!user || user.type !== "HUMAN" || !user.isActive) {
    return false;
  }

  const adminEmails = parseAdminList(process.env.ADMIN_EMAILS);
  const adminUsernames = parseAdminList(process.env.ADMIN_USERNAMES);

  return (
    (user.email ? adminEmails.has(user.email.toLowerCase()) : false) ||
    adminUsernames.has(user.username.toLowerCase())
  );
}

export async function requireAdminSessionUser(): Promise<User> {
  const user = await authenticateSessionUser();

  if (!isAdminUser(user)) {
    throw new Error("FORBIDDEN");
  }

  return user as User;
}

export function canDeleteUser(user: Pick<User, "id" | "username" | "isBuiltIn">, viewerId: string) {
  if (user.id === viewerId) {
    return false;
  }

  if (user.isBuiltIn || user.username === "system") {
    return false;
  }

  return true;
}

export function canToggleActive(user: Pick<User, "id">, viewerId: string) {
  return user.id !== viewerId;
}
