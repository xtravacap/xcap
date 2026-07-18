import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole, requireApiUser } from "@/lib/auth";
import { withApiErrorHandling, jsonOk, NotFoundError, ForbiddenError } from "@/lib/api-utils";
import { runMatchingForLoanRequest } from "@/lib/matching/run";

export const GET = withApiErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const { id } = await params;

  const loanRequest = await prisma.loanRequest.findFirst({ where: { id, borrower: { organizationId: user.organizationId } } });
  if (!loanRequest) throw new NotFoundError("Loan request not found");
  if (user.role === "BORROWER" && user.borrowerId !== loanRequest.borrowerId) throw new ForbiddenError();

  const matches = await prisma.match.findMany({
    where: {
      loanRequestId: id,
      ...(user.role === "LENDER" ? { lenderId: user.lenderId ?? "__none__" } : {}),
    },
    include: { lender: true, loanProgram: true, overriddenBy: true },
    orderBy: { score: "desc" },
  });

  return jsonOk({ matches });
});

/** Recomputes the matching engine for this loan request (e.g. after a lender updates a program). */
export const POST = withApiErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiRole("ADMIN");
  const { id } = await params;

  const loanRequest = await prisma.loanRequest.findFirst({ where: { id, borrower: { organizationId: user.organizationId } } });
  if (!loanRequest) throw new NotFoundError("Loan request not found");

  await runMatchingForLoanRequest(id);
  const matches = await prisma.match.findMany({
    where: { loanRequestId: id },
    include: { lender: true, loanProgram: true },
    orderBy: { score: "desc" },
  });

  return jsonOk({ matches });
});
