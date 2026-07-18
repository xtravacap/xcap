import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/dashboard/status-badge";
import { formatCompactCurrency, formatDate, titleCase } from "@/lib/utils";

export default async function BorrowerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("ADMIN");

  const borrower = await prisma.borrower.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      loanRequests: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { documents: true, matches: true } } },
      },
    },
  });
  if (!borrower) return notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{borrower.borrowerName}</h1>
        <p className="text-muted-foreground text-sm">{borrower.email}{borrower.phone ? ` · ${borrower.phone}` : ""}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Business" value={borrower.businessName || "—"} />
        <Field label="Entity" value={borrower.entityType || "—"} />
        <Field label="Experience" value={borrower.experienceYears ? `${borrower.experienceYears} years` : "—"} />
        <Field label="Credit score" value={borrower.creditScore?.toString() ?? "—"} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Loan requests</h2>
        <div className="space-y-3">
          {borrower.loanRequests.map((lr) => (
            <Link key={lr.id} href={`/loan-requests/${lr.id}`}>
              <Card className="glass-panel hover:border-primary/50 transition-colors">
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>{lr.propertyAddress}</CardTitle>
                    <CardDescription>
                      {formatCompactCurrency(Number(lr.requestedLoanAmount))} · {titleCase(lr.propertyType)} · Submitted {formatDate(lr.createdAt)} ·{" "}
                      {lr._count.matches} matches · {lr._count.documents} documents
                    </CardDescription>
                  </div>
                  <RequestStatusBadge status={lr.status} />
                </CardHeader>
              </Card>
            </Link>
          ))}
          {borrower.loanRequests.length === 0 && <p className="text-muted-foreground text-sm">No loan requests yet.</p>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="text-lg font-semibold">{value}</CardContent>
    </Card>
  );
}
