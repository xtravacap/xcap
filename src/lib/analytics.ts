import { prisma } from "@/lib/prisma";

/** Shared analytics computation — used by both the /api/analytics/summary
 * route (for client-side refetching) and server components that want the
 * same numbers without an extra network hop. */
export async function getAnalyticsSummary(organizationId: string) {
  const [
    totalLenders,
    totalBorrowers,
    totalLoanRequests,
    newSubmissions30d,
    pendingMatches,
    fundedMatches,
    avgLoanAmount,
    pipeline,
    topStatesRaw,
    topAssetClassesRaw,
    mostActiveLendersRaw,
    fundedCount,
    recentActivity,
  ] = await Promise.all([
    prisma.lender.count({ where: { organizationId } }),
    prisma.borrower.count({ where: { organizationId } }),
    prisma.loanRequest.count({ where: { borrower: { organizationId } } }),
    prisma.loanRequest.count({
      where: { borrower: { organizationId }, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.match.count({ where: { status: "SUGGESTED", loanRequest: { borrower: { organizationId } } } }),
    prisma.match.count({ where: { status: "FUNDED", loanRequest: { borrower: { organizationId } } } }),
    prisma.loanRequest.aggregate({ where: { borrower: { organizationId } }, _avg: { requestedLoanAmount: true } }),
    prisma.loanRequest.groupBy({ by: ["status"], where: { borrower: { organizationId } }, _count: true }),
    prisma.loanRequest.groupBy({
      by: ["propertyState"],
      where: { borrower: { organizationId } },
      _count: true,
      orderBy: { _count: { propertyState: "desc" } },
      take: 8,
    }),
    prisma.loanRequest.groupBy({
      by: ["propertyType"],
      where: { borrower: { organizationId } },
      _count: true,
      orderBy: { _count: { propertyType: "desc" } },
      take: 8,
    }),
    prisma.match.groupBy({
      by: ["lenderId"],
      where: { loanRequest: { borrower: { organizationId } } },
      _count: true,
      orderBy: { _count: { lenderId: "desc" } },
      take: 8,
    }),
    prisma.match.groupBy({
      by: ["lenderId"],
      where: { status: "FUNDED", loanRequest: { borrower: { organizationId } } },
      _count: true,
      orderBy: { _count: { lenderId: "desc" } },
      take: 8,
    }),
    prisma.activityLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { actor: { select: { firstName: true, lastName: true, email: true } } },
    }),
  ]);

  const lenderNames = await prisma.lender.findMany({
    where: { id: { in: [...mostActiveLendersRaw.map((l) => l.lenderId), ...fundedCount.map((l) => l.lenderId)] } },
    select: { id: true, companyName: true },
  });
  const lenderNameMap = new Map(lenderNames.map((l) => [l.id, l.companyName]));

  const totalClosedOrFunded = await prisma.loanRequest.count({
    where: { borrower: { organizationId }, status: { in: ["CLOSED_WON", "CLOSED_LOST"] } },
  });
  const totalWon = await prisma.loanRequest.count({ where: { borrower: { organizationId }, status: "CLOSED_WON" } });

  // Average time from submission to first match (proxy for "response time").
  const matchedRequests = await prisma.loanRequest.findMany({
    where: { borrower: { organizationId }, status: { not: "SUBMITTED" } },
    select: { createdAt: true, matches: { orderBy: { createdAt: "asc" }, take: 1, select: { createdAt: true } } },
    take: 200,
  });
  const responseTimes = matchedRequests
    .filter((r) => r.matches[0])
    .map((r) => r.matches[0].createdAt.getTime() - r.createdAt.getTime());
  const avgResponseMs = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

  return {
    totals: {
      lenders: totalLenders,
      borrowers: totalBorrowers,
      loanRequests: totalLoanRequests,
      newSubmissions30d,
      pendingMatches,
      fundedLoans: fundedMatches,
      avgLoanAmount: avgLoanAmount._avg.requestedLoanAmount ? Number(avgLoanAmount._avg.requestedLoanAmount) : 0,
      avgResponseMinutes: Math.round(avgResponseMs / 60_000),
      conversionRate: totalClosedOrFunded > 0 ? Math.round((totalWon / totalClosedOrFunded) * 1000) / 10 : 0,
    },
    pipeline: pipeline.map((p) => ({ status: p.status, count: p._count })),
    topStates: topStatesRaw.map((s) => ({ state: s.propertyState, count: s._count })),
    topAssetClasses: topAssetClassesRaw.map((s) => ({ propertyType: s.propertyType, count: s._count })),
    mostActiveLenders: mostActiveLendersRaw.map((l) => ({
      lenderId: l.lenderId,
      companyName: lenderNameMap.get(l.lenderId) ?? "Unknown",
      matchCount: l._count,
    })),
    mostFundedLenders: fundedCount.map((l) => ({
      lenderId: l.lenderId,
      companyName: lenderNameMap.get(l.lenderId) ?? "Unknown",
      fundedCount: l._count,
    })),
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      action: a.action,
      entityType: a.entityType,
      createdAt: a.createdAt,
      actor: a.actor ? `${a.actor.firstName ?? ""} ${a.actor.lastName ?? ""}`.trim() || a.actor.email : "System",
    })),
  };
}

export type AnalyticsSummary = Awaited<ReturnType<typeof getAnalyticsSummary>>;
