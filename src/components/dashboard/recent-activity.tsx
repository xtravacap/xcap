import { Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTION_LABELS: Record<string, string> = {
  "lender.created": "added a new lender",
  "lender.updated": "updated a lender profile",
  "lender.deleted": "removed a lender",
  "loan_program.created": "added a loan program",
  "loan_request.submitted": "submitted a loan request",
  "loan_request.matched": "ran the matching engine",
  "match.status_changed": "updated a match status",
};

export function RecentActivity({
  items,
}: {
  items: { id: string; action: string; actor: string; createdAt: string | Date }[];
}) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="size-4" /> Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <span className="font-medium">{item.actor}</span>{" "}
                  <span className="text-muted-foreground">{ACTION_LABELS[item.action] ?? item.action}</span>
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
