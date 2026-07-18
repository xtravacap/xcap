import Link from "next/link";
import { Building2, Clock, FileStack, TrendingUp, Users, Workflow } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnalyticsSummary } from "@/lib/analytics";
import { StatCard } from "@/components/dashboard/stat-card";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge, MatchStatusBadge } from "@/components/dashboard/status-badge";
import { formatCompactCurrency, formatDate, titleCase } from "@/lib/utils";

async function AdminDashboard({ organizationId }: { organizationId: string }) {
  const summary = await getAnalyticsSummary(organizationId);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total lenders" value={summary.totals.lenders} icon={Building2} />
        <StatCard label="Total borrowers" value={summary.totals.borrowers} icon={Users} />
        <StatCard label="New submissions (30d)" value={summary.totals.newSubmissions30d} icon={FileStack} />
        <StatCard label="Pending matches" value={summary.totals.pendingMatches} icon={Workflow} />
        <StatCard label="Loans funded" value={summary.totals.fundedLoans} icon={TrendingUp} />
        <StatCard
          label="Avg. response time"
          value={summary.totals.avgResponseMinutes < 60 ? `${summary.totals.avgResponseMinutes}m` : `${(summary.totals.avgResponseMinutes / 60).toFixed(1)}h`}
          icon={Clock}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-panel lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>Loan requests by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineChart data={summary.pipeline} />
          </CardContent>
        </Card>
        <RecentActivity items={summary.recentActivity} />
      </div>
    </div>
  );
}

async function LenderDashboard({ lenderId }: { lenderId: string }) {
  const [lender, matches] = await Promise.all([
    prisma.lender.findUnique({ where: { id: lenderId }, include: { _count: { select: { loanPrograms: true } } } }),
    prisma.match.findMany({
      where: { lenderId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { loanRequest: { include: { borrower: true } } },
    }),
  ]);

  const introduced = matches.filter((m) => m.status === "INTRODUCED" || m.status === "RESPONDED" || m.status === "FUNDED").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active programs" value={lender?._count.loanPrograms ?? 0} icon={FileStack} />
        <StatCard label="Referrals received" value={matches.length} icon={Workflow} />
        <StatCard label="Introductions" value={introduced} icon={TrendingUp} />
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Recent referrals from Xtrava Capital</CardTitle>
          <CardDescription>Deals matched to your loan programs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {matches.length === 0 && <p className="text-muted-foreground text-sm">No referrals yet.</p>}
          {matches.map((match) => (
            <div key={match.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">
                  {formatCompactCurrency(Number(match.loanRequest.requestedLoanAmount))} · {titleCase(match.loanRequest.propertyType)} ·{" "}
                  {match.loanRequest.propertyState}
                </p>
                <p className="text-muted-foreground text-xs">Score {match.score}%</p>
              </div>
              <MatchStatusBadge status={match.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

async function BorrowerDashboard({ borrowerId }: { borrowerId: string | null }) {
  const loanRequests = borrowerId
    ? await prisma.loanRequest.findMany({
        where: { borrowerId },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { documents: true, matches: true } } },
      })
    : [];

  if (loanRequests.length === 0) {
    return (
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Start your financing request</CardTitle>
          <CardDescription>Tell us about your deal and we&apos;ll match you with the right capital partners.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/apply">Submit a loan request</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {loanRequests.map((lr) => (
        <Card key={lr.id} className="glass-panel">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{lr.propertyAddress}</CardTitle>
              <CardDescription>
                {formatCompactCurrency(Number(lr.requestedLoanAmount))} · {titleCase(lr.propertyType)} · Submitted{" "}
                {formatDate(lr.createdAt)}
              </CardDescription>
            </div>
            <RequestStatusBadge status={lr.status} />
          </CardHeader>
          <CardContent className="flex gap-6 text-sm">
            <span>{lr._count.documents} documents</span>
            <span>{lr._count.matches} lenders matched</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back{user.firstName ? `, ${user.firstName}` : ""}</h1>
        <p className="text-muted-foreground text-sm">Here&apos;s what&apos;s happening across Xtrava Capital.</p>
      </div>

      {user.role === "ADMIN" && <AdminDashboard organizationId={user.organizationId} />}
      {user.role === "LENDER" && user.lenderId && <LenderDashboard lenderId={user.lenderId} />}
      {user.role === "BORROWER" && <BorrowerDashboard borrowerId={user.borrowerId} />}
    </div>
  );
}
