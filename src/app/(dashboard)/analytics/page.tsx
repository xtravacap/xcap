import { requireRole } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/analytics";
import { StatCard } from "@/components/dashboard/stat-card";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { RankingBar } from "@/components/analytics/ranking-bar";
import { AssetClassChart } from "@/components/analytics/asset-class-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, DollarSign, TrendingUp, Users } from "lucide-react";
import { formatCompactCurrency, titleCase } from "@/lib/utils";

export default async function AnalyticsPage() {
  const user = await requireRole("ADMIN");
  const summary = await getAnalyticsSummary(user.organizationId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Performance across your lender network and pipeline.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Avg. loan size" value={formatCompactCurrency(summary.totals.avgLoanAmount)} icon={DollarSign} />
        <StatCard label="Conversion rate" value={`${summary.totals.conversionRate}%`} icon={TrendingUp} hint="Closed-won ÷ closed deals" />
        <StatCard label="Total lenders" value={summary.totals.lenders} icon={Building2} />
        <StatCard label="Total borrowers" value={summary.totals.borrowers} icon={Users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Funding pipeline</CardTitle>
            <CardDescription>Loan requests by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineChart data={summary.pipeline} />
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Top asset classes</CardTitle>
            <CardDescription>Submission volume by property type</CardDescription>
          </CardHeader>
          <CardContent>
            <AssetClassChart data={summary.topAssetClasses} />
            <div className="mt-2 flex flex-wrap gap-3">
              {summary.topAssetClasses.map((a) => (
                <span key={a.propertyType} className="text-muted-foreground text-xs">
                  {titleCase(a.propertyType)}: {a.count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Most active lenders</CardTitle>
            <CardDescription>By number of matches generated</CardDescription>
          </CardHeader>
          <CardContent>
            <RankingBar items={summary.mostActiveLenders.map((l) => ({ label: l.companyName, value: l.matchCount }))} />
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Most funded lenders</CardTitle>
            <CardDescription>By closed/funded loans</CardDescription>
          </CardHeader>
          <CardContent>
            <RankingBar items={summary.mostFundedLenders.map((l) => ({ label: l.companyName, value: l.fundedCount }))} />
          </CardContent>
        </Card>

        <Card className="glass-panel lg:col-span-2">
          <CardHeader>
            <CardTitle>Top states</CardTitle>
            <CardDescription>Where your submission volume is coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <RankingBar items={summary.topStates.map((s) => ({ label: s.state, value: s.count }))} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
