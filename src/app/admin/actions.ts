"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hashPassword } from "@/lib/auth-helpers";
import { canDeleteUser, canToggleActive, requireAdminSessionUser } from "@/lib/admin";
import { prisma } from "@/lib/db";

const targetSchema = z.object({
  userId: z.string().uuid(),
  next: z.string().optional(),
});

const passwordSchema = targetSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

function finish(next: string | undefined, status: string): never {
  const target = next && next.startsWith("/admin") ? next : "/admin";
  return redirect(`${target}${target.includes("?") ? "&" : "?"}status=${encodeURIComponent(status)}`);
}

function parseTargetForm(formData: FormData) {
  const parsed = targetSchema.safeParse({
    userId: formData.get("userId"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    finish("/admin", "Invalid user action.");
  }

  return parsed.data;
}

function parsePasswordForm(formData: FormData) {
  const parsed = passwordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    finish("/admin", parsed.error.issues[0]?.message ?? "Invalid password reset request.");
  }

  return parsed.data;
}

export async function resetUserPasswordAction(formData: FormData) {
  await requireAdminSessionUser();
  const parsed = parsePasswordForm(formData);

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { id: true, type: true, username: true },
  });

  if (!user) {
    finish(parsed.next, "User not found.");
  }

  if (user.type !== "HUMAN") {
    finish(parsed.next, "Only human accounts have passwords.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.password),
    },
  });

  revalidatePath("/admin");
  finish(parsed.next, `Password reset for @${user.username}.`);
}

export async function toggleUserActiveAction(formData: FormData) {
  const viewer = await requireAdminSessionUser();
  const parsed = parseTargetForm(formData);

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { id: true, username: true, isActive: true },
  });

  if (!user) {
    finish(parsed.next, "User not found.");
  }

  if (!canToggleActive(user, viewer.id)) {
    finish(parsed.next, "You cannot deactivate your own account from admin.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: !user.isActive },
  });

  revalidatePath("/admin");
  finish(parsed.next, `${user.isActive ? "Deactivated" : "Reactivated"} @${user.username}.`);
}

export async function revokeAgentKeyAction(formData: FormData) {
  await requireAdminSessionUser();
  const parsed = parseTargetForm(formData);

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { id: true, username: true, type: true },
  });

  if (!user) {
    finish(parsed.next, "User not found.");
  }

  if (user.type !== "AGENT") {
    finish(parsed.next, "Only agent accounts have API keys.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      apiKey: null,
      apiKeyPrefix: null,
    },
  });

  revalidatePath("/admin");
  finish(parsed.next, `Revoked API key for @${user.username}.`);
}

export async function deleteUserAction(formData: FormData) {
  const viewer = await requireAdminSessionUser();
  const parsed = parseTargetForm(formData);

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { id: true, username: true, isBuiltIn: true },
  });

  if (!user) {
    finish(parsed.next, "User not found.");
  }

  if (!canDeleteUser(user, viewer.id)) {
    finish(parsed.next, "This account cannot be deleted from admin.");
  }

  await prisma.user.delete({
    where: { id: user.id },
  });

  revalidatePath("/admin");
  finish(parsed.next, `Deleted @${user.username}.`);
}
