import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoanProgramForm } from "@/components/loan-programs/loan-program-form";

export default async function EditLoanProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const program = await prisma.loanProgram.findFirst({
    where: { id, lender: { organizationId: user.organizationId } },
  });
  if (!program) return notFound();
  if (user.role === "LENDER" && user.lenderId !== program.lenderId) return notFound();
  if (user.role === "BORROWER") return notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit {program.programName}</h1>
      <LoanProgramForm
        programId={program.id}
        defaultValues={{
          lenderId: program.lenderId,
          programName: program.programName,
          loanType: program.loanType,
          purposes: program.purposes,
          minLoanAmount: Number(program.minLoanAmount),
          maxLoanAmount: Number(program.maxLoanAmount),
          minDscr: program.minDscr,
          maxLtv: program.maxLtv,
          maxLtc: program.maxLtc,
          interestRateMin: program.interestRateMin,
          interestRateMax: program.interestRateMax,
          termMonths: program.termMonths,
          amortizationMonths: program.amortizationMonths,
          prepayment: program.prepayment,
          interestOnly: program.interestOnly,
          propertyTypes: program.propertyTypes,
          allowedStates: program.allowedStates,
          isBridge: program.isBridge,
          isPermanent: program.isPermanent,
          isConstruction: program.isConstruction,
          isValueAdd: program.isValueAdd,
          isGroundUp: program.isGroundUp,
          isFixFlip: program.isFixFlip,
          isRentalPortfolio: program.isRentalPortfolio,
          isCommercial: program.isCommercial,
          isResidential: program.isResidential,
          isActive: program.isActive,
        }}
      />
    </div>
  );
}
