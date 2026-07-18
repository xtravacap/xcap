import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { prisma } from "@/lib/prisma";
import { getDefaultOrganization } from "@/lib/organization";

/**
 * Syncs Clerk users into our local `User` table so the rest of the app can
 * join on our own IDs/roles without calling out to Clerk on every request.
 *
 * Configure this endpoint's URL + signing secret in the Clerk dashboard
 * (Webhooks) as CLERK_WEBHOOK_SECRET. New users default to the BORROWER
 * role; promote admins/lenders from the Settings > Team page (or by editing
 * ADMIN_EMAILS below) after they sign up.
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

  let event: {
    type: string;
    data: {
      id: string;
      email_addresses?: { id: string; email_address: string }[];
      primary_email_address_id?: string;
      first_name?: string | null;
      last_name?: string | null;
      image_url?: string | null;
      phone_numbers?: { phone_number: string }[];
    };
  };

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
    const { id, email_addresses, primary_email_address_id, first_name, last_name, image_url, phone_numbers } =
      event.data;
    const primaryEmail =
      email_addresses?.find((e) => e.id === primary_email_address_id)?.email_address ??
      email_addresses?.[0]?.email_address;

    if (!primaryEmail) {
      return NextResponse.json({ error: "User has no email address" }, { status: 400 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const org = await getDefaultOrganization();

    await prisma.user.upsert({
      where: { clerkId: id },
      update: {
        email: primaryEmail,
        firstName: first_name ?? undefined,
        lastName: last_name ?? undefined,
        avatarUrl: image_url ?? undefined,
        phone: phone_numbers?.[0]?.phone_number ?? undefined,
      },
      create: {
        clerkId: id,
        email: primaryEmail,
        firstName: first_name ?? undefined,
        lastName: last_name ?? undefined,
        avatarUrl: image_url ?? undefined,
        phone: phone_numbers?.[0]?.phone_number ?? undefined,
        role: adminEmails.includes(primaryEmail.toLowerCase()) ? "ADMIN" : "BORROWER",
        organizationId: org.id,
      },
    });
  }

  // Note: user.deleted is intentionally a no-op. Hard-deleting would cascade
  // into comments/notifications/activity authored by the user (Restrict by
  // default), which we don't want to lose; soft-delete/anonymize can be
  // added here if account deletion becomes a real product requirement.

  return NextResponse.json({ received: true });
}
