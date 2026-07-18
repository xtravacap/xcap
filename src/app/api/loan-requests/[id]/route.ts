import { NextRequest } from "next/server";
import { after } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole, requireApiUser } from "@/lib/auth";
import { withApiErrorHandling, jsonOk, NotFoundError, ForbiddenError } from "@/lib/api-utils";
import { loanRequestStatusUpdateSchema } from "@/lib/validation/loan-request";
import { notifyStatusChanged } from "@/lib/notify";

async function loadScopedLoanRequest(id: string, organizationId: string) {
  const loanRequest = await prisma.loanRequest.findFirst({
    where: { id, borrower: { organizationId } },
    include: {
      borrower: true,
      documents: { orderBy: { createdAt: "desc" } },
      comments: { orderBy: { createdAt: "asc" }, include: { author: true } },
      matches: {
        orderBy: { score: "desc" },
        include: { lender: true, loanProgram: true, overriddenBy: true },
      },
    },
  });
  if (!loanRequest) throw new NotFoundError("Loan request not found");
  return loanRequest;
}

export const GET = withApiErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const loanRequest = await loadScopedLoanRequest(id, user.organizationId);

  if (user.role === "BORROWER" && user.borrowerId !== loanRequest.borrowerId) throw new ForbiddenError();
  if (user.role === "LENDER" && !loanRequest.matches.some((m) => m.lenderId === user.lenderId)) {
    throw new ForbiddenError();
  }

  return jsonOk({ loanRequest });
});

export const PATCH = withApiErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireApiRole("ADMIN");
  const { id } = await params;
  const { status } = loanRequestStatusUpdateSchema.parse(await req.json());

  const loanRequest = await prisma.loanRequest.update({ where: { id }, data: { status } });

  after(async () => {
    try {
      await notifyStatusChanged(id, status);
    } catch (error) {
      console.error("Status-change notification failed", error);
    }
  });

  return jsonOk({ loanRequest });
});
