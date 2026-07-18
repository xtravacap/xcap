import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { withApiErrorHandling, jsonOk } from "@/lib/api-utils";
import { parseLenderSearchQuery } from "@/lib/search/parse-query";
import { formatCompactCurrency, titleCase } from "@/lib/utils";

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const user = await requireApiUser();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return jsonOk({ lenders: [], loanRequests: [] });
  }

  const { where: parsedWhere, interpretation } = parseLenderSearchQuery(q);
  const hasStructuredFilters = Object.keys(parsedWhere).length > 0;

  const lenders = await prisma.lender.findMany({
    where: {
      organizationId: user.organizationId,
      ...parsedWhere,
      ...(hasStructuredFilters
        ? {}
        : { OR: [{ companyName: { contains: q, mode: "insensitive" } }, { primaryContact: { contains: q, mode: "insensitive" } }] }),
    },
    take: 8,
    orderBy: { companyName: "asc" },
  });

  const loanRequests =
    user.role === "ADMIN"
      ? await prisma.loanRequest.findMany({
          where: {
            borrower: { organizationId: user.organizationId },
            OR: [
              { propertyAddress: { contains: q, mode: "insensitive" } },
              { borrower: { borrowerName: { contains: q, mode: "insensitive" } } },
              { borrower: { email: { contains: q, mode: "insensitive" } } },
            ],
          },
          include: { borrower: true },
          take: 6,
        })
      : [];

  return jsonOk({
    interpretation: interpretation.length > 0 ? interpretation.join(", ") : undefined,
    lenders: lenders.map((lender) => ({
      id: lender.id,
      title: lender.companyName,
      subtitle: `${formatCompactCurrency(Number(lender.minLoanAmount))}–${formatCompactCurrency(Number(lender.maxLoanAmount))} · ${lender.states.slice(0, 4).join(", ") || "Nationwide"}`,
    })),
    loanRequests: loanRequests.map((lr) => ({
      id: lr.id,
      title: `${lr.borrower.borrowerName} — ${titleCase(lr.propertyType)}`,
      subtitle: `${lr.propertyAddress}, ${lr.propertyState}`,
    })),
  });
});
