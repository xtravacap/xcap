import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";

const REQUEST_STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  SUBMITTED: "secondary",
  UNDER_REVIEW: "warning",
  MATCHED: "default",
  INTRODUCED: "default",
  IN_UNDERWRITING: "warning",
  CLOSED_WON: "success",
  CLOSED_LOST: "destructive",
  WITHDRAWN: "outline",
};

const MATCH_STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  SUGGESTED: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  INTRODUCED: "default",
  RESPONDED: "warning",
  DECLINED_BY_LENDER: "destructive",
  FUNDED: "success",
};

export function RequestStatusBadge({ status }: { status: string }) {
  return <Badge variant={REQUEST_STATUS_VARIANT[status] ?? "outline"}>{titleCase(status)}</Badge>;
}

export function MatchStatusBadge({ status }: { status: string }) {
  return <Badge variant={MATCH_STATUS_VARIANT[status] ?? "outline"}>{titleCase(status)}</Badge>;
}
