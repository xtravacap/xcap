import { NextRequest } from "next/server";
import { after } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { withApiErrorHandling, jsonOk, NotFoundError, ForbiddenError } from "@/lib/api-utils";
import { commentSchema } from "@/lib/validation/comment";
import { notifyAdminComment } from "@/lib/notify";

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const user = await requireApiRole("ADMIN", "BORROWER");
  const body = commentSchema.parse(await req.json());

  const loanRequest = await prisma.loanRequest.findFirst({
    where: { id: body.loanRequestId, borrower: { organizationId: user.organizationId } },
  });
  if (!loanRequest) throw new NotFoundError("Loan request not found");
  if (user.role === "BORROWER" && user.borrowerId !== loanRequest.borrowerId) throw new ForbiddenError();

  const comment = await prisma.comment.create({
    data: { loanRequestId: body.loanRequestId, authorId: user.id, body: body.body },
    include: { author: true },
  });

  if (user.role === "ADMIN") {
    after(async () => {
      try {
        await notifyAdminComment(comment.id);
      } catch (error) {
        console.error("Admin comment notification failed", error);
      }
    });
  }

  return jsonOk({ comment }, { status: 201 });
});
