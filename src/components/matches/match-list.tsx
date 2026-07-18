"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, Building2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MatchStatusBadge } from "@/components/dashboard/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface MatchListItem {
  id: string;
  score: number;
  status: string;
  lenderId: string;
  companyName: string;
  programName: string | null;
  reasons: { matches: string[]; warnings: string[]; disqualifiers: string[] };
  overriddenByName?: string | null;
}

const STATUS_TRANSITIONS = ["SUGGESTED", "APPROVED", "REJECTED", "INTRODUCED", "RESPONDED", "DECLINED_BY_LENDER", "FUNDED"];

function scoreColor(score: number) {
  if (score >= 85) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

export function MatchList({
  matches,
  canOverride = false,
  showLenderLink = true,
}: {
  matches: MatchListItem[];
  canOverride?: boolean;
  showLenderLink?: boolean;
}) {
  const router = useRouter();

  async function updateStatus(matchId: string, status: string) {
    const res = await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success("Match updated");
      router.refresh();
    } else {
      toast.error("Failed to update match");
    }
  }

  if (matches.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">No matches yet.</p>;
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <Card key={match.id} className="glass-panel">
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <div className="flex items-center gap-3">
              <div className={cn("text-2xl font-bold tabular-nums", scoreColor(match.score))}>{match.score}%</div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Building2 className="size-3.5" />
                  {showLenderLink ? (
                    <Link href={`/lenders/${match.lenderId}`} className="hover:underline">
                      {match.companyName}
                    </Link>
                  ) : (
                    match.companyName
                  )}
                </p>
                {match.programName && <p className="text-muted-foreground text-xs">{match.programName}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MatchStatusBadge status={match.status} />
              {canOverride && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Update
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {STATUS_TRANSITIONS.map((status) => (
                      <DropdownMenuItem key={status} onClick={() => updateStatus(match.id, status)}>
                        {status.replaceAll("_", " ")}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={match.score} indicatorClassName={match.score >= 85 ? "bg-success" : match.score >= 60 ? "bg-warning" : "bg-destructive"} />
            <div className="grid gap-2 sm:grid-cols-3">
              <ReasonList icon={<CheckCircle2 className="text-success size-3.5" />} items={match.reasons.matches} />
              <ReasonList icon={<AlertTriangle className="text-warning size-3.5" />} items={match.reasons.warnings} />
              <ReasonList icon={<XCircle className="text-destructive size-3.5" />} items={match.reasons.disqualifiers} />
            </div>
            {match.overriddenByName && (
              <p className="text-muted-foreground text-xs">Overridden by {match.overriddenByName}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReasonList({ icon, items }: { icon: React.ReactNode; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-1.5 text-xs">
          <span className="mt-0.5 shrink-0">{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
