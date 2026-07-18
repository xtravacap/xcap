import "server-only";
import type { User as ClerkUser } from "@clerk/backend";

import { prisma } from "@/lib/prisma";
import { getDefaultOrganization } from "@/lib/organization";

/** Shape common to both the Clerk webhook payload (snake_case) and the Backend API `User` object (camelCase). */
export interface ClerkUserLike {
  id: string;
  emailAddresses?: { id: string; emailAddress: string }[];
  email_addresses?: { id: string; email_address: string }[];
  primaryEmailAddressId?: string | null;
  primary_email_address_id?: string | null;
  firstName?: string | null;
  first_name?: string | null;
  lastName?: string | null;
  last_name?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  phoneNumbers?: { phoneNumber: string }[];
  phone_numbers?: { phone_number: string }[];
}

function primaryEmailOf(clerkUser: ClerkUserLike): string | undefined {
  const emails = (clerkUser.emailAddresses ?? clerkUser.email_addresses ?? []).map((e) => ({
    id: e.id,
    email: "emailAddress" in e ? e.emailAddress : e.email_address,
  }));
  const primaryId = clerkUser.primaryEmailAddressId ?? clerkUser.primary_email_address_id;
  return emails.find((e) => e.id === primaryId)?.email ?? emails[0]?.email;
}

function firstPhoneOf(clerkUser: ClerkUserLike): string | undefined {
  const phones = (clerkUser.phoneNumbers ?? clerkUser.phone_numbers ?? []).map((p) =>
    "phoneNumber" in p ? p.phoneNumber : p.phone_number,
  );
  return phones[0];
}

/**
 * Upserts a Clerk user into our local `User` table. Shared by the Clerk
 * webhook (the steady-state sync path) and `getCurrentUser()`'s just-in-time
 * fallback (so a slow/misfired webhook can never lock someone out of an
 * account Clerk has already authenticated).
 */
export async function syncUserFromClerk(clerkUser: ClerkUserLike) {
  const primaryEmail = primaryEmailOf(clerkUser);
  if (!primaryEmail) return null;

  const firstName = clerkUser.firstName ?? clerkUser.first_name ?? undefined;
  const lastName = clerkUser.lastName ?? clerkUser.last_name ?? undefined;
  const avatarUrl = clerkUser.imageUrl ?? clerkUser.image_url ?? undefined;
  const phone = firstPhoneOf(clerkUser);

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const org = await getDefaultOrganization();
  const profileFields = { email: primaryEmail, firstName, lastName, avatarUrl, phone };

  const existingByClerkId = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (existingByClerkId) {
    return prisma.user.update({ where: { id: existingByClerkId.id }, data: profileFields });
  }

  // A row with this email but a *different* (stale) clerkId can exist — e.g. seed
  // data, or a leftover row from deleting/recreating a Clerk test account. `email`
  // is globally unique, so blindly creating here would throw a P2002; instead,
  // claim that row for this real Clerk account rather than crashing.
  const existingByEmail = await prisma.user.findUnique({ where: { email: primaryEmail } });
  if (existingByEmail) {
    return prisma.user.update({ where: { id: existingByEmail.id }, data: { clerkId: clerkUser.id, ...profileFields } });
  }

  return prisma.user.create({
    data: {
      ...profileFields,
      clerkId: clerkUser.id,
      role: adminEmails.includes(primaryEmail.toLowerCase()) ? "ADMIN" : "BORROWER",
      organizationId: org.id,
    },
  });
}

export type { ClerkUser };
