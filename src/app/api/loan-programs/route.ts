import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { withApiErrorHandling, jsonOk, NotFoundError, ForbiddenError } from "@/lib/api-utils";
import { loanProgramSchema } from "@/lib/validation/loan-program";

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const user = await requireApiRole("ADMIN", "LENDER");
  const { searchParams } = new URL(req.url);
  const lenderId = searchParams.get("lenderId");

  const programs = await prisma.loanProgram.findMany({
    where: {
      lender: { organizationId: user.organizationId },
      ...(lenderId ? { lenderId } : {}),
      ...(user.role === "LENDER" ? { lenderId: user.lenderId ?? "__none__" } : {}),
    },
    include: { lender: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk({ programs });
});

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const user = await requireApiRole("ADMIN", "LENDER");
  const body = loanProgramSchema.parse(await req.json());

  const lender = await prisma.lender.findFirst({ where: { id: body.lenderId, organizationId: user.organizationId } });
  if (!lender) throw new NotFoundError("Lender not found");
  if (user.role === "LENDER" && user.lenderId !== lender.id) {
    throw new ForbiddenError("You can only add programs to your own lender profile");
  }

  const program = await prisma.loanProgram.create({ data: body });

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      actorId: user.id,
      action: "loan_program.created",
      entityType: "LoanProgram",
      entityId: program.id,
      metadata: { programName: program.programName, lenderId: lender.id },
    },
  });

  return jsonOk({ program }, { status: 201 });
});
