import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LenderForm } from "@/components/lenders/lender-form";

export default async function EditLenderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.lenderId !== id) return notFound();

  const lender = await prisma.lender.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!lender) return notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit {lender.companyName}</h1>
        <p className="text-muted-foreground text-sm">Update lending box, capabilities, and requirements.</p>
      </div>
      <LenderForm
        lenderId={lender.id}
        defaultValues={{
          companyName: lender.companyName,
          primaryContact: lender.primaryContact,
          email: lender.email,
          phone: lender.phone,
          website: lender.website,
          logoUrl: lender.logoUrl,
          loanTypes: lender.loanTypes,
          propertyTypes: lender.propertyTypes,
          states: lender.states,
          minLoanAmount: Number(lender.minLoanAmount),
          maxLoanAmount: Number(lender.maxLoanAmount),
          maxLtc: lender.maxLtc,
          maxLtv: lender.maxLtv,
          minDscr: lender.minDscr,
          minCreditScore: lender.minCreditScore,
          recourse: lender.recourse,
          interestRateMin: lender.interestRateMin,
          interestRateMax: lender.interestRateMax,
          originationFeeMin: lender.originationFeeMin,
          originationFeeMax: lender.originationFeeMax,
          allowsBridge: lender.allowsBridge,
          allowsDscr: lender.allowsDscr,
          allowsConstruction: lender.allowsConstruction,
          allowsGroundUp: lender.allowsGroundUp,
          allowsFixFlip: lender.allowsFixFlip,
          allowsMultifamily: lender.allowsMultifamily,
          allowsMixedUse: lender.allowsMixedUse,
          allowsRetail: lender.allowsRetail,
          allowsOffice: lender.allowsOffice,
          allowsIndustrial: lender.allowsIndustrial,
          allowsSelfStorage: lender.allowsSelfStorage,
          allowsHospitality: lender.allowsHospitality,
          allowsLand: lender.allowsLand,
          preferredMarkets: lender.preferredMarkets,
          requiredExperienceYears: lender.requiredExperienceYears,
          sponsorNetWorthRequirement: lender.sponsorNetWorthRequirement ? Number(lender.sponsorNetWorthRequirement) : null,
          liquidityRequirement: lender.liquidityRequirement ? Number(lender.liquidityRequirement) : null,
          entityRequirements: lender.entityRequirements,
          prepaymentPenalty: lender.prepaymentPenalty,
          closingTimelineDays: lender.closingTimelineDays,
          notes: lender.notes,
          isActive: lender.isActive,
        }}
      />
    </div>
  );
}
