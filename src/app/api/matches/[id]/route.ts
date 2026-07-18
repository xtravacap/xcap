import { NextRequest } from "next/server";
import { after } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { withApiErrorHandling, jsonOk, NotFoundError } from "@/lib/api-utils";
import { matchOverrideSchema } from "@/lib/validation/comment";
import { notifyLenderMatched } from "@/lib/notify";

export const PATCH = withApiErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiRole("ADMIN");
  const { id } = await params;
  const body = matchOverrideSchema.parse(await req.json());

  const existing = await prisma.match.findFirst({
    where: { id, loanRequest: { borrower: { organizationId: user.organizationId } } },
  });
  if (!existing) throw new NotFoundError("Match not found");

  const match = await prisma.match.update({
    where: { id },
    data: {
      status: body.status,
      overrideNote: body.overrideNote,
      overriddenById: user.id,
      introducedAt: body.status === "INTRODUCED" ? new Date() : existing.introducedAt,
      respondedAt: ["RESPONDED", "DECLINED_BY_LENDER", "FUNDED"].includes(body.status) ? new Date() : existing.respondedAt,
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      actorId: user.id,
      action: "match.status_changed",
      entityType: "Match",
      entityId: match.id,
      metadata: { status: body.status },
    },
  });

  if (body.status === "INTRODUCED") {
    after(async () => {
      try {
        await notifyLenderMatched(match.id);
      } catch (error) {
        console.error("Introduction notification failed", error);
      }
    });
  }

  return jsonOk({ match });
});
