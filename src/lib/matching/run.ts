import { prisma } from "@/lib/prisma";
import { rankLendersForRequest } from "./engine";
import { toMatchableLender, toMatchableLoanProgram, toMatchableLoanRequest } from "./mappers";
import { notifyLenderMatched } from "@/lib/notify";

/** Score is high enough to be worth pinging the lender proactively. */
const LENDER_NOTIFY_THRESHOLD = 70;

/**
 * Runs the matching engine for a single loan request against every active
 * lender program in the same organization, and upserts the results as
 * `Match` rows. Manual overrides (status/overriddenBy/overrideNote) are
 * preserved across re-runs — only score/reasons are refreshed.
 */
export async function runMatchingForLoanRequest(loanRequestId: string) {
  const loanRequest = await prisma.loanRequest.findUniqueOrThrow({
    where: { id: loanRequestId },
    include: { borrower: true },
  });

  const lenders = await prisma.lender.findMany({
    where: { organizationId: loanRequest.borrower.organizationId, isActive: true },
    include: { loanPrograms: { where: { isActive: true } } },
  });

  const ranked = rankLendersForRequest(
    toMatchableLoanRequest(loanRequest),
    lenders.map((lender) => ({
      lender: toMatchableLender(lender),
      programs: lender.loanPrograms.map(toMatchableLoanProgram),
    })),
  );

  const results = await Promise.all(
    ranked.map((result) =>
      prisma.match.upsert({
        where: {
          loanRequestId_loanProgramId: {
            loanRequestId,
            loanProgramId: result.programId,
          },
        },
        update: {
          score: result.score,
          reasons: { matches: result.matches, warnings: result.warnings, disqualifiers: result.disqualifiers },
        },
        create: {
          loanRequestId,
          lenderId: result.lenderId,
          loanProgramId: result.programId,
          score: result.score,
          reasons: { matches: result.matches, warnings: result.warnings, disqualifiers: result.disqualifiers },
        },
      }),
    ),
  );

  if (loanRequest.status === "SUBMITTED" || loanRequest.status === "UNDER_REVIEW") {
    await prisma.loanRequest.update({ where: { id: loanRequestId }, data: { status: "MATCHED" } });
  }

  await prisma.activityLog.create({
    data: {
      organizationId: loanRequest.borrower.organizationId,
      action: "loan_request.matched",
      entityType: "LoanRequest",
      entityId: loanRequestId,
      metadata: { matchCount: results.length, topScore: ranked[0]?.score ?? null },
    },
  });

  const strongNewMatches = results.filter(
    (r) => r.score >= LENDER_NOTIFY_THRESHOLD && r.createdAt.getTime() === r.updatedAt.getTime(),
  );
  await Promise.all(strongNewMatches.map((match) => notifyLenderMatched(match.id)));

  return results;
}
