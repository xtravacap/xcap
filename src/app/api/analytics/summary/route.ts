import { requireApiRole } from "@/lib/auth";
import { withApiErrorHandling, jsonOk } from "@/lib/api-utils";
import { getAnalyticsSummary } from "@/lib/analytics";

export const GET = withApiErrorHandling(async () => {
  const user = await requireApiRole("ADMIN");
  const summary = await getAnalyticsSummary(user.organizationId);
  return jsonOk(summary);
});
