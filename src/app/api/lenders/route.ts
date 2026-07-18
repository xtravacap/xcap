import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { withApiErrorHandling, jsonOk } from "@/lib/api-utils";
import { lenderSchema } from "@/lib/validation/lender";
import { getDefaultOrganization } from "@/lib/organization";

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const user = await requireApiRole("ADMIN", "LENDER");
  const { searchParams } = new URL(req.url);

  const state = searchParams.get("state");
  const loanType = searchParams.get("loanType");
  const propertyType = searchParams.get("propertyType");
  const minLoanAmount = searchParams.get("minLoanAmount");
  const q = searchParams.get("q");

  const lenders = await prisma.lender.findMany({
    where: {
      organizationId: user.organizationId,
      ...(state ? { states: { has: state.toUpperCase() } } : {}),
      ...(loanType ? { loanTypes: { has: loanType as never } } : {}),
      ...(propertyType ? { propertyTypes: { has: propertyType as never } } : {}),
      ...(minLoanAmount ? { maxLoanAmount: { gte: Number(minLoanAmount) } } : {}),
      ...(q
        ? {
            OR: [
              { companyName: { contains: q, mode: "insensitive" } },
              { primaryContact: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { loanPrograms: true, matches: true } } },
    orderBy: { companyName: "asc" },
  });

  return jsonOk({ lenders });
});

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const user = await requireApiRole("ADMIN");
  const body = lenderSchema.parse(await req.json());
  const org = await getDefaultOrganization();

  const lender = await prisma.lender.create({
    data: { ...body, organizationId: org.id },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: org.id,
      actorId: user.id,
      action: "lender.created",
      entityType: "Lender",
      entityId: lender.id,
      metadata: { companyName: lender.companyName },
    },
  });

  return jsonOk({ lender }, { status: 201 });
});
