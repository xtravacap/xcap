import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MatchList } from "@/components/matches/match-list";
import { RequestStatusBadge } from "@/components/dashboard/status-badge";
import { formatCompactCurrency, titleCase } from "@/lib/utils";

export default async function MatchesPage() {
  const user = await requireUser();

  if (user.role === "LENDER") {
    const matches = await prisma.match.findMany({
      where: { lenderId: user.lenderId ?? "__none__" },
      orderBy: { score: "desc" },
      include: { loanRequest: { include: { borrower: true } }, loanProgram: true },
      take: 50,
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Referrals</h1>
          <p className="text-muted-foreground text-sm">Deals Xtrava Capital has matched to your loan programs.</p>
        </div>
        <MatchList
          showLenderLink={false}
          matches={matches.map((m) => ({
            id: m.id,
            score: m.score,
            status: m.status,
            lenderId: m.lenderId,
            companyName: `${formatCompactCurrency(Number(m.loanRequest.requestedLoanAmount))} · ${titleCase(m.loanRequest.propertyType)} · ${m.loanRequest.propertyState}`,
            programName: m.loanProgram?.programName ?? null,
            reasons: m.reasons as { matches: string[]; warnings: string[]; disqualifiers: string[] },
          }))}
        />
      </div>
    );
  }

  if (user.role === "BORROWER") {
    const loanRequests = await prisma.loanRequest.findMany({
      where: { borrowerId: user.borrowerId ?? "__none__" },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Your matches</h1>
          <p className="text-muted-foreground text-sm">Lenders matched to your submission(s).</p>
        </div>
        {loanRequests.map((lr) => (
          <Link key={lr.id} href={`/loan-requests/${lr.id}`}>
            <Card className="glass-panel hover:border-primary/50 transition-colors">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>{lr.propertyAddress}</CardTitle>
                  <CardDescription>{formatCompactCurrency(Number(lr.requestedLoanAmount))} · {titleCase(lr.propertyType)}</CardDescription>
                </div>
                <RequestStatusBadge status={lr.status} />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    );
  }

  // ADMIN: every loan request with its top match score.
  const loanRequests = await prisma.loanRequest.findMany({
    where: { borrower: { organizationId: user.organizationId } },
    orderBy: { createdAt: "desc" },
    include: {
      borrower: true,
      matches: { orderBy: { score: "desc" }, take: 1 },
      _count: { select: { matches: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Matches</h1>
        <p className="text-muted-foreground text-sm">Every loan request, ranked by top lender fit.</p>
      </div>
      <div className="grid gap-3">
        {loanRequests.map((lr) => (
          <Link key={lr.id} href={`/loan-requests/${lr.id}`}>
            <Card className="glass-panel hover:border-primary/50 transition-colors">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    {lr.borrower.borrowerName} — {lr.propertyAddress}
                  </CardTitle>
                  <CardDescription>
                    {formatCompactCurrency(Number(lr.requestedLoanAmount))} · {titleCase(lr.propertyType)} · {lr.propertyState} ·{" "}
                    {lr._count.matches} lenders scored
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {lr.matches[0] && <span className="text-lg font-bold">{lr.matches[0].score}%</span>}
                  <RequestStatusBadge status={lr.status} />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
        {loanRequests.length === 0 && <p className="text-muted-foreground py-10 text-center text-sm">No loan requests yet.</p>}
      </div>
    </div>
  );
}
