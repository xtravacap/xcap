import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LendersTable } from "@/components/lenders/lenders-table";

export default async function LendersPage() {
  const user = await requireRole("ADMIN", "LENDER");

  if (user.role === "LENDER") {
    redirect(user.lenderId ? `/lenders/${user.lenderId}` : "/dashboard");
  }

  const lenders = await prisma.lender.findMany({
    where: { organizationId: user.organizationId },
    include: { _count: { select: { loanPrograms: true, matches: true } } },
    orderBy: { companyName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lenders</h1>
        <p className="text-muted-foreground text-sm">Every capital partner Xtrava works with, and every program they offer.</p>
      </div>
      <LendersTable
        lenders={lenders.map((lender) => ({
          id: lender.id,
          companyName: lender.companyName,
          primaryContact: lender.primaryContact,
          email: lender.email,
          states: lender.states,
          minLoanAmount: Number(lender.minLoanAmount),
          maxLoanAmount: Number(lender.maxLoanAmount),
          isActive: lender.isActive,
          programCount: lender._count.loanPrograms,
          matchCount: lender._count.matches,
        }))}
      />
    </div>
  );
}
