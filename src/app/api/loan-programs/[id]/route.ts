import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { withApiErrorHandling, jsonOk, NotFoundError, ForbiddenError } from "@/lib/api-utils";
import { loanProgramUpdateSchema } from "@/lib/validation/loan-program";

async function loadOwnedProgram(id: string, organizationId: string) {
  const program = await prisma.loanProgram.findFirst({
    where: { id, lender: { organizationId } },
    include: { lender: true },
  });
  if (!program) throw new NotFoundError("Loan program not found");
  return program;
}

export const GET = withApiErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiRole("ADMIN", "LENDER");
  const { id } = await params;
  const program = await loadOwnedProgram(id, user.organizationId);
  if (user.role === "LENDER" && user.lenderId !== program.lenderId) throw new ForbiddenError();
  return jsonOk({ program });
});

export const PATCH = withApiErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiRole("ADMIN", "LENDER");
  const { id } = await params;
  const program = await loadOwnedProgram(id, user.organizationId);
  if (user.role === "LENDER" && user.lenderId !== program.lenderId) throw new ForbiddenError();

  const body = loanProgramUpdateSchema.parse(await req.json());
  const updated = await prisma.loanProgram.update({ where: { id }, data: body });

  return jsonOk({ program: updated });
});

export const DELETE = withApiErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiRole("ADMIN", "LENDER");
  const { id } = await params;
  const program = await loadOwnedProgram(id, user.organizationId);
  if (user.role === "LENDER" && user.lenderId !== program.lenderId) throw new ForbiddenError();

  await prisma.loanProgram.delete({ where: { id } });
  return jsonOk({ success: true });
});
