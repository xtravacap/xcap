import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LoanProgramForm } from "@/components/loan-programs/loan-program-form";
import type { LoanProgramInput } from "@/lib/validation/loan-program";

const DEFAULTS: Omit<LoanProgramInput, "lenderId"> = {
  programName: "",
  loanType: "BRIDGE",
  purposes: [],
  minLoanAmount: 500_000,
  maxLoanAmount: 5_000_000,
  minDscr: 1.2,
  maxLtv: 75,
  maxLtc: 80,
  interestRateMin: 8,
  interestRateMax: 12,
  termMonths: 12,
  amortizationMonths: null,
  prepayment: "",
  interestOnly: true,
  propertyTypes: [],
  allowedStates: [],
  isBridge: false,
  isPermanent: false,
  isConstruction: false,
  isValueAdd: false,
  isGroundUp: false,
  isFixFlip: false,
  isRentalPortfolio: false,
  isCommercial: true,
  isResidential: false,
  isActive: true,
};

export default async function NewLoanProgramPage({ searchParams }: { searchParams: Promise<{ lenderId?: string }> }) {
  const user = await requireRole("ADMIN", "LENDER");
  const { lenderId: queryLenderId } = await searchParams;

  if (user.role === "LENDER") {
    if (!user.lenderId) redirect("/dashboard");
    return (
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold">Add loan program</h1>
        <LoanProgramForm defaultValues={{ ...DEFAULTS, lenderId: user.lenderId }} />
      </div>
    );
  }

  const lenders = await prisma.lender.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, companyName: true },
    orderBy: { companyName: "asc" },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Add loan program</h1>
      <LoanProgramForm lenders={lenders} defaultValues={{ ...DEFAULTS, lenderId: queryLenderId ?? lenders[0]?.id ?? "" }} />
    </div>
  );
}
