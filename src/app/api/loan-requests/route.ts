import { NextRequest } from "next/server";
import { after } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole, requireApiUser } from "@/lib/auth";
import { withApiErrorHandling, jsonOk } from "@/lib/api-utils";
import { loanRequestSubmissionSchema } from "@/lib/validation/loan-request";
import { runMatchingForLoanRequest } from "@/lib/matching/run";
import { notifySubmissionReceived } from "@/lib/notify";

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const user = await requireApiUser();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const loanRequests = await prisma.loanRequest.findMany({
    where: {
      borrower: { organizationId: user.organizationId },
      ...(status ? { status: status as never } : {}),
      ...(user.role === "BORROWER" ? { borrowerId: user.borrowerId ?? "__none__" } : {}),
      ...(user.role === "LENDER" ? { matches: { some: { lenderId: user.lenderId ?? "__none__" } } } : {}),
    },
    include: {
      borrower: { select: { id: true, borrowerName: true, email: true } },
      _count: { select: { matches: true, documents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk({ loanRequests });
});

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const user = await requireApiRole("ADMIN", "BORROWER");
  const body = loanRequestSubmissionSchema.parse(await req.json());

  const borrower = await prisma.borrower.upsert({
    where: user.borrowerId
      ? { id: user.borrowerId }
      : { organizationId_email: { organizationId: user.organizationId, email: body.borrower.email } },
    update: { ...body.borrower },
    create: {
      ...body.borrower,
      organizationId: user.organizationId,
    },
  });

  // Link a first-time borrower's account to the profile it just submitted under.
  if (user.role === "BORROWER" && !user.borrowerId) {
    await prisma.user.update({ where: { id: user.id }, data: { borrowerId: borrower.id } });
  }

  const loanRequest = await prisma.loanRequest.create({
    data: { ...body.loanRequest, borrowerId: borrower.id },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      actorId: user.id,
      action: "loan_request.submitted",
      entityType: "LoanRequest",
      entityId: loanRequest.id,
    },
  });

  after(async () => {
    try {
      await notifySubmissionReceived(loanRequest.id);
      await runMatchingForLoanRequest(loanRequest.id);
    } catch (error) {
      console.error("Post-submission matching/notification failed", error);
    }
  });

  return jsonOk({ loanRequest }, { status: 201 });
});
