import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { withApiErrorHandling, jsonOk, NotFoundError, ForbiddenError } from "@/lib/api-utils";
import { borrowerContactSchema } from "@/lib/validation/loan-request";

export const GET = withApiErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const { id } = await params;

  const borrower = await prisma.borrower.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      loanRequests: {
        orderBy: { createdAt: "desc" },
        include: { documents: true, matches: { orderBy: { score: "desc" } } },
      },
    },
  });
  if (!borrower) throw new NotFoundError("Borrower not found");
  if (user.role === "BORROWER" && user.borrowerId !== borrower.id) throw new ForbiddenError();

  return jsonOk({ borrower });
});

export const PATCH = withApiErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const { id } = await params;

  const borrower = await prisma.borrower.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!borrower) throw new NotFoundError("Borrower not found");
  if (user.role === "BORROWER" && user.borrowerId !== borrower.id) throw new ForbiddenError();
  if (user.role !== "ADMIN" && user.role !== "BORROWER") throw new ForbiddenError();

  const body = borrowerContactSchema.partial().parse(await req.json());
  const updated = await prisma.borrower.update({ where: { id }, data: body });

  return jsonOk({ borrower: updated });
});
