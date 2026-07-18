import { requireApiUser } from "@/lib/auth";
import { withApiErrorHandling, jsonOk } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export const GET = withApiErrorHandling(async () => {
  const user = await requireApiUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return jsonOk({ notifications });
});

export const PATCH = withApiErrorHandling(async () => {
  const user = await requireApiUser();
  await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  return jsonOk({ success: true });
});
