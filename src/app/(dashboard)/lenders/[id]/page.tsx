import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Mail, Pencil, Phone } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LenderProgramsList } from "@/components/lenders/lender-programs-list";
import { LenderDocumentsPanel } from "@/components/lenders/lender-documents-panel";
import { DeleteLenderButton } from "@/components/lenders/delete-lender-button";
import { formatCompactCurrency, formatPercent, titleCase } from "@/lib/utils";

export default async function LenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (user.role === "LENDER" && user.lenderId !== id) {
    return notFound();
  }

  const lender = await prisma.lender.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      loanPrograms: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!lender) return notFound();

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{lender.companyName}</h1>
            <Badge variant={lender.isActive ? "success" : "outline"}>{lender.isActive ? "Active" : "Inactive"}</Badge>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Building2 className="size-3.5" /> {lender.primaryContact}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="size-3.5" /> {lender.email}
            </span>
            {lender.phone && (
              <span className="flex items-center gap-1">
                <Phone className="size-3.5" /> {lender.phone}
              </span>
            )}
          </p>
        </div>
        {(isAdmin || user.lenderId === id) && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/lenders/${id}/edit`}>
                <Pencil /> Edit profile
              </Link>
            </Button>
            {isAdmin && <DeleteLenderButton lenderId={id} />}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Loan range</CardDescription>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {formatCompactCurrency(Number(lender.minLoanAmount))}–{formatCompactCurrency(Number(lender.maxLoanAmount))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Max LTV / LTC</CardDescription>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {formatPercent(lender.maxLtv)} / {formatPercent(lender.maxLtc)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Min DSCR / Credit</CardDescription>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {lender.minDscr ?? "—"} / {lender.minCreditScore ?? "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recourse</CardDescription>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{titleCase(lender.recourse)}</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="programs">
        <TabsList>
          <TabsTrigger value="programs">Loan Programs ({lender.loanPrograms.length})</TabsTrigger>
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="mt-4">
          <LenderProgramsList
            lenderId={lender.id}
            programs={lender.loanPrograms.map((p) => ({
              id: p.id,
              programName: p.programName,
              loanType: p.loanType,
              minLoanAmount: Number(p.minLoanAmount),
              maxLoanAmount: Number(p.maxLoanAmount),
              maxLtv: p.maxLtv,
              maxLtc: p.maxLtc,
              minDscr: p.minDscr,
              isActive: p.isActive,
            }))}
          />
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <Field label="States" value={lender.states.join(", ") || "Nationwide"} />
              <Field label="Property types" value={lender.propertyTypes.map(titleCase).join(", ") || "—"} />
              <Field label="Interest rate range" value={`${formatPercent(lender.interestRateMin)} – ${formatPercent(lender.interestRateMax)}`} />
              <Field label="Origination fee" value={`${formatPercent(lender.originationFeeMin)} – ${formatPercent(lender.originationFeeMax)}`} />
              <Field label="Required experience" value={lender.requiredExperienceYears ? `${lender.requiredExperienceYears} years` : "—"} />
              <Field label="Closing timeline" value={lender.closingTimelineDays ? `${lender.closingTimelineDays} days` : "—"} />
              <Field label="Sponsor net worth requirement" value={lender.sponsorNetWorthRequirement ? formatCompactCurrency(Number(lender.sponsorNetWorthRequirement)) : "—"} />
              <Field label="Liquidity requirement" value={lender.liquidityRequirement ? formatCompactCurrency(Number(lender.liquidityRequirement)) : "—"} />
              <Field label="Preferred markets" value={lender.preferredMarkets.join(", ") || "—"} full />
              <Field label="Entity requirements" value={lender.entityRequirements || "—"} full />
              <Field label="Prepayment penalty" value={lender.prepaymentPenalty || "—"} full />
              <Field label="Notes" value={lender.notes || "—"} full />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <LenderDocumentsPanel
            lenderId={lender.id}
            documents={lender.documents.map((d) => ({
              id: d.id,
              fileName: d.fileName,
              documentType: d.documentType,
              extractionStatus: d.extractionStatus,
              createdAt: d.createdAt,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
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
