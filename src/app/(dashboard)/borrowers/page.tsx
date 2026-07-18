import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BorrowersTable } from "@/components/borrowers/borrowers-table";

export default async function BorrowersPage() {
  const user = await requireRole("ADMIN");

  const borrowers = await prisma.borrower.findMany({
    where: { organizationId: user.organizationId },
    include: {
      loanRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, requestedLoanAmount: true, propertyType: true, propertyState: true, createdAt: true },
      },
      _count: { select: { loanRequests: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Borrowers</h1>
        <p className="text-muted-foreground text-sm">Everyone who has submitted a financing request.</p>
      </div>
      <BorrowersTable
        borrowers={borrowers.map((b) => ({
          id: b.id,
          borrowerName: b.borrowerName,
          email: b.email,
          businessName: b.businessName,
          loanRequestCount: b._count.loanRequests,
          latestRequest: b.loanRequests[0]
            ? {
                id: b.loanRequests[0].id,
                status: b.loanRequests[0].status,
                requestedLoanAmount: Number(b.loanRequests[0].requestedLoanAmount),
                propertyType: b.loanRequests[0].propertyType,
                propertyState: b.loanRequests[0].propertyState,
                createdAt: b.loanRequests[0].createdAt,
              }
            : null,
        }))}
      />
    </div>
  );
}
