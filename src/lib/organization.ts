import { prisma } from "@/lib/prisma";

export const DEFAULT_ORG_SLUG = "xtrava-capital";

/**
 * Returns the single-tenant default organization, creating it if this is a
 * fresh database. The schema is already multi-tenant shaped (every core
 * model carries an `organizationId`) so flipping on real multi-company
 * support later is a matter of wiring org selection into auth, not a schema
 * migration.
 */
export async function getDefaultOrganization() {
  return prisma.organization.upsert({
    where: { slug: DEFAULT_ORG_SLUG },
    update: {},
    create: { name: "Xtrava Capital", slug: DEFAULT_ORG_SLUG },
  });
}
