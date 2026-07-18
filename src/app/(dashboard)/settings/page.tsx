import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BorrowerSettingsForm } from "@/components/settings/borrower-settings-form";
import { titleCase } from "@/lib/utils";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and role-specific preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Signed in as {user.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Badge variant="outline">{titleCase(user.role)}</Badge>
          <span className="text-muted-foreground text-sm">
            {user.firstName} {user.lastName}
          </span>
        </CardContent>
      </Card>

      {user.role === "LENDER" && user.lenderId && (
        <Card>
          <CardHeader>
            <CardTitle>Lender profile</CardTitle>
            <CardDescription>Update your loan programs, lending areas, rates, and leverage.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/lenders/${user.lenderId}/edit`}>Edit lender profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {user.role === "BORROWER" && user.borrowerId && (
        <BorrowerProfileSection borrowerId={user.borrowerId} />
      )}

      {user.role === "ADMIN" && <AdminOrgSection organizationId={user.organizationId} />}
    </div>
  );
}

async function BorrowerProfileSection({ borrowerId }: { borrowerId: string }) {
  const borrower = await prisma.borrower.findUnique({ where: { id: borrowerId } });
  if (!borrower) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Your information</h2>
      <BorrowerSettingsForm
        borrowerId={borrower.id}
        defaultValues={{
          borrowerName: borrower.borrowerName,
          email: borrower.email,
          phone: borrower.phone,
          businessName: borrower.businessName,
          entityType: borrower.entityType,
          experienceYears: borrower.experienceYears,
          creditScore: borrower.creditScore,
          liquidity: borrower.liquidity ? Number(borrower.liquidity) : null,
          netWorth: borrower.netWorth ? Number(borrower.netWorth) : null,
        }}
      />
    </div>
  );
}

async function AdminOrgSection({ organizationId }: { organizationId: string }) {
  const [org, teamCounts] = await Promise.all([
    prisma.organization.findUnique({ where: { id: organizationId } }),
    prisma.user.groupBy({ by: ["role"], where: { organizationId }, _count: true }),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>{org?.name}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4">
        {teamCounts.map((t) => (
          <div key={t.role} className="text-sm">
            <p className="text-muted-foreground text-xs">{titleCase(t.role)}s</p>
            <p className="text-lg font-semibold">{t._count}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
