import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Loads the local `User` row (with our role + org) for the signed-in Clerk session, if any. */
export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { clerkId: userId } });
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
