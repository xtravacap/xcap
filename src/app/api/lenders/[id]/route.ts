import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { withApiErrorHandling, jsonOk, NotFoundError } from "@/lib/api-utils";
import { lenderUpdateSchema } from "@/lib/validation/lender";

export const GET = withApiErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiRole("ADMIN", "LENDER");
  const { id } = await params;

  const lender = await prisma.lender.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { loanPrograms: { orderBy: { createdAt: "desc" } }, _count: { select: { matches: true } } },
  });
  if (!lender) throw new NotFoundError("Lender not found");

  return jsonOk({ lender });
});

export const PATCH = withApiErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiRole("ADMIN");
  const { id } = await params;
  const existing = await prisma.lender.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!existing) throw new NotFoundError("Lender not found");

  const body = lenderUpdateSchema.parse(await req.json());
  const lender = await prisma.lender.update({ where: { id }, data: body });

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      actorId: user.id,
      action: "lender.updated",
      entityType: "Lender",
      entityId: lender.id,
    },
  });

  return jsonOk({ lender });
});

export const DELETE = withApiErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiRole("ADMIN");
  const { id } = await params;
  const existing = await prisma.lender.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!existing) throw new NotFoundError("Lender not found");

  await prisma.lender.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      actorId: user.id,
      action: "lender.deleted",
      entityType: "Lender",
      entityId: id,
      metadata: { companyName: existing.companyName },
    },
  });

  return jsonOk({ success: true });
});
