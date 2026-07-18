import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { withApiErrorHandling, jsonOk } from "@/lib/api-utils";

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const user = await requireApiRole("ADMIN");
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const borrowers = await prisma.borrower.findMany({
    where: {
      organizationId: user.organizationId,
      ...(q
        ? {
            OR: [
              { borrowerName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { businessName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      loanRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, requestedLoanAmount: true, propertyType: true, propertyState: true, createdAt: true },
      },
      _count: { select: { loanRequests: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk({ borrowers });
});
