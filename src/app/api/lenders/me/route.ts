import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { withApiErrorHandling, jsonOk, NotFoundError } from "@/lib/api-utils";
import { lenderUpdateSchema } from "@/lib/validation/lender";

/** Self-service endpoint for a logged-in Lender to view/update their own profile. */
export const GET = withApiErrorHandling(async () => {
  const user = await requireApiRole("LENDER");
  if (!user.lenderId) throw new NotFoundError("No lender profile linked to this account");

  const lender = await prisma.lender.findUnique({
    where: { id: user.lenderId },
    include: { loanPrograms: { orderBy: { createdAt: "desc" } } },
  });
  if (!lender) throw new NotFoundError("Lender not found");

  return jsonOk({ lender });
});

export const PATCH = withApiErrorHandling(async (req: NextRequest) => {
  const user = await requireApiRole("LENDER");
  if (!user.lenderId) throw new NotFoundError("No lender profile linked to this account");

  const body = lenderUpdateSchema.parse(await req.json());
  const lender = await prisma.lender.update({ where: { id: user.lenderId }, data: body });

  return jsonOk({ lender });
});
