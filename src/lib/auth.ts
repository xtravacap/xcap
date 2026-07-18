import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { syncUserFromClerk } from "@/lib/sync-user";

/**
 * Loads the local `User` row (with our role + org) for the signed-in Clerk
 * session, if any. If Clerk has authenticated this session but our webhook
 * hasn't synced a local row yet (webhook delivery is async and can race a
 * client redirected here immediately after signing up), fetch the user from
 * Clerk directly and sync it inline rather than bouncing them back out.
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  return syncUserFromClerk(clerkUser);
}

/** For Server Components/pages: redirects to sign-in if unauthenticated. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** For Server Components/pages: redirects to the dashboard if the role doesn't match. */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do this") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** For API route handlers: throws instead of redirecting so callers can map to HTTP status codes. */
export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireApiRole(...roles: Role[]) {
  const user = await requireApiUser();
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}
