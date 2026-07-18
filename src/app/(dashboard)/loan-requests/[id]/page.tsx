import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestStatusBadge } from "@/components/dashboard/status-badge";
import { StatusSelector } from "@/components/loan-requests/status-selector";
import { DocumentsPanel } from "@/components/loan-requests/documents-panel";
import { CommentsPanel } from "@/components/loan-requests/comments-panel";
import { MatchList } from "@/components/matches/match-list";
import { formatCompactCurrency, formatDate, formatPercent, titleCase } from "@/lib/utils";

export default async function LoanRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const loanRequest = await prisma.loanRequest.findFirst({
    where: { id, borrower: { organizationId: user.organizationId } },
    include: {
      borrower: true,
      documents: { orderBy: { createdAt: "desc" } },
      comments: { orderBy: { createdAt: "asc" }, include: { author: true } },
      matches: {
        orderBy: { score: "desc" },
        include: { lender: true, loanProgram: true, overriddenBy: true },
      },
    },
  });
  if (!loanRequest) return notFound();
  if (user.role === "BORROWER" && user.borrowerId !== loanRequest.borrowerId) return notFound();
  if (user.role === "LENDER" && !loanRequest.matches.some((m) => m.lenderId === user.lenderId)) return notFound();

  const isAdmin = user.role === "ADMIN";
  const visibleMatches = user.role === "LENDER" ? loanRequest.matches.filter((m) => m.lenderId === user.lenderId) : loanRequest.matches;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{loanRequest.propertyAddress}</h1>
          <p className="text-muted-foreground text-sm">
            {loanRequest.borrower.borrowerName} · Submitted {formatDate(loanRequest.createdAt)}
          </p>
        </div>
        {isAdmin ? (
          <StatusSelector loanRequestId={loanRequest.id} status={loanRequest.status} />
        ) : (
          <RequestStatusBadge status={loanRequest.status} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Requested amount" value={formatCompactCurrency(Number(loanRequest.requestedLoanAmount))} />
        <Metric label="Property type" value={titleCase(loanRequest.propertyType)} />
        <Metric label="LTV / LTC" value={`${formatPercent(loanRequest.ltv)} / ${formatPercent(loanRequest.ltc)}`} />
        <Metric label="DSCR" value={loanRequest.dscr?.toString() ?? "—"} />
      </div>

      <Tabs defaultValue="matches">
        <TabsList>
          <TabsTrigger value="matches">Matches ({visibleMatches.length})</TabsTrigger>
          <TabsTrigger value="details">Deal Details</TabsTrigger>
          <TabsTrigger value="documents">Documents ({loanRequest.documents.length})</TabsTrigger>
          {(isAdmin || user.role === "BORROWER") && <TabsTrigger value="comments">Comments</TabsTrigger>}
        </TabsList>

        <TabsContent value="matches" className="mt-4">
          <MatchList
            canOverride={isAdmin}
            matches={visibleMatches.map((m) => ({
              id: m.id,
              score: m.score,
              status: m.status,
              lenderId: m.lenderId,
              companyName: m.lender.companyName,
              programName: m.loanProgram?.programName ?? null,
              reasons: m.reasons as { matches: string[]; warnings: string[]; disqualifiers: string[] },
              overriddenByName: m.overriddenBy ? `${m.overriddenBy.firstName ?? ""} ${m.overriddenBy.lastName ?? ""}`.trim() : null,
            }))}
          />
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Borrower</CardTitle>
              <CardDescription>{loanRequest.borrower.email}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name" value={loanRequest.borrower.businessName || "—"} />
              <Field label="Entity" value={loanRequest.borrower.entityType || "—"} />
              <Field label="Experience" value={loanRequest.borrower.experienceYears ? `${loanRequest.borrower.experienceYears} years` : "—"} />
              <Field label="Credit score" value={loanRequest.borrower.creditScore?.toString() ?? "—"} />
              <Field label="Liquidity" value={loanRequest.borrower.liquidity ? formatCompactCurrency(Number(loanRequest.borrower.liquidity)) : "—"} />
              <Field label="Net worth" value={loanRequest.borrower.netWorth ? formatCompactCurrency(Number(loanRequest.borrower.netWorth)) : "—"} />
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Property & deal</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Address" value={`${loanRequest.propertyAddress}, ${loanRequest.propertyCity ?? ""} ${loanRequest.propertyState} ${loanRequest.propertyZip ?? ""}`} />
              <Field label="Purchase price" value={loanRequest.purchasePrice ? formatCompactCurrency(Number(loanRequest.purchasePrice)) : "—"} />
              <Field label="Property value" value={loanRequest.propertyValue ? formatCompactCurrency(Number(loanRequest.propertyValue)) : "—"} />
              <Field label="NOI" value={loanRequest.noi ? formatCompactCurrency(Number(loanRequest.noi)) : "—"} />
              <Field label="Cap rate" value={formatPercent(loanRequest.capRate)} />
              <Field label="Loan purpose" value={titleCase(loanRequest.loanPurpose)} />
              <Field label="Occupancy" value={loanRequest.occupancy ? titleCase(loanRequest.occupancy) : "—"} />
              <Field label="Recourse preference" value={loanRequest.recoursePreference ? titleCase(loanRequest.recoursePreference) : "No preference"} />
              <Field label="Timeline" value={loanRequest.timelineDays ? `${loanRequest.timelineDays} days` : "—"} />
              <Field label="Target closing date" value={loanRequest.closingDate ? formatDate(loanRequest.closingDate) : "—"} />
              <Field label="Exit strategy" value={loanRequest.exitStrategy || "—"} full />
              <Field label="Notes" value={loanRequest.notes || "—"} full />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsPanel
            loanRequestId={loanRequest.id}
            canUpload={isAdmin || user.role === "BORROWER"}
            documents={loanRequest.documents.map((d) => ({
              id: d.id,
              fileName: d.fileName,
              documentType: d.documentType,
              extractionStatus: d.extractionStatus,
              createdAt: d.createdAt,
            }))}
          />
        </TabsContent>

        {(isAdmin || user.role === "BORROWER") && (
          <TabsContent value="comments" className="mt-4">
            <CommentsPanel
              loanRequestId={loanRequest.id}
              comments={loanRequest.comments.map((c) => ({
                id: c.id,
                body: c.body,
                createdAt: c.createdAt,
                author: { firstName: c.author.firstName, lastName: c.author.lastName, email: c.author.email },
              }))}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="text-lg font-semibold">{value}</CardContent>
    </Card>
  );
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
