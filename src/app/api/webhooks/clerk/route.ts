import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { syncUserFromClerk, type ClerkUserLike } from "@/lib/sync-user";

/**
 * Syncs Clerk users into our local `User` table so the rest of the app can
 * join on our own IDs/roles without calling out to Clerk on every request.
 *
 * Configure this endpoint's URL + signing secret in the Clerk dashboard
 * (Webhooks) as CLERK_WEBHOOK_SECRET. New users default to the BORROWER
 * role; ADMIN_EMAILS controls who gets auto-promoted to ADMIN on sign-up.
 *
 * This is the steady-state sync path — `getCurrentUser()` in lib/auth.ts
 * also does this same sync inline as a fallback, since webhook delivery is
 * asynchronous and can otherwise race a client that's redirected to a
 * protected page immediately after signing up.
 */
export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: { type: string; data: ClerkUserLike };

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const user = await syncUserFromClerk(event.data);
    if (!user) {
      return NextResponse.json({ error: "User has no email address" }, { status: 400 });
    }
  }

  // Note: user.deleted is intentionally a no-op. Hard-deleting would cascade
  // into comments/notifications/activity authored by the user (Restrict by
  // default), which we don't want to lose; soft-delete/anonymize can be
  // added here if account deletion becomes a real product requirement.

  return NextResponse.json({ received: true });
}
