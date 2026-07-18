import type { Borrower, Lender, LoanProgram, LoanRequest } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import type { MatchableLender, MatchableLoanProgram, MatchableLoanRequest } from "./types";

function num(value: Decimal | number | null | undefined): number | null {
  if (value == null) return null;
  return typeof value === "number" ? value : value.toNumber();
}

export function toMatchableLender(lender: Lender): MatchableLender {
  return {
    id: lender.id,
    companyName: lender.companyName,
    states: lender.states,
    propertyTypes: lender.propertyTypes,
    minLoanAmount: num(lender.minLoanAmount) ?? 0,
    maxLoanAmount: num(lender.maxLoanAmount) ?? 0,
    maxLtc: lender.maxLtc,
    maxLtv: lender.maxLtv,
    minDscr: lender.minDscr,
    minCreditScore: lender.minCreditScore,
    recourse: lender.recourse,
    requiredExperienceYears: lender.requiredExperienceYears,
    sponsorNetWorthRequirement: num(lender.sponsorNetWorthRequirement),
    liquidityRequirement: num(lender.liquidityRequirement),
    closingTimelineDays: lender.closingTimelineDays,
    isActive: lender.isActive,
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
  };
}

export function toMatchableLoanProgram(program: LoanProgram): MatchableLoanProgram {
  return {
    id: program.id,
    programName: program.programName,
    loanType: program.loanType,
    purposes: program.purposes,
    minLoanAmount: num(program.minLoanAmount) ?? 0,
    maxLoanAmount: num(program.maxLoanAmount) ?? 0,
    minDscr: program.minDscr,
    maxLtv: program.maxLtv,
    maxLtc: program.maxLtc,
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
  };
}

export function toMatchableLoanRequest(request: LoanRequest & { borrower: Borrower }): MatchableLoanRequest {
  return {
    requestedLoanAmount: num(request.requestedLoanAmount) ?? 0,
    purchasePrice: num(request.purchasePrice),
    propertyValue: num(request.propertyValue),
    ltv: request.ltv,
    ltc: request.ltc,
    dscr: request.dscr,
    propertyType: request.propertyType,
    propertyState: request.propertyState,
    occupancy: request.occupancy,
    loanPurpose: request.loanPurpose,
    recoursePreference: request.recoursePreference,
    timelineDays: request.timelineDays,
    creditScore: request.borrower.creditScore,
    liquidity: num(request.borrower.liquidity),
    netWorth: num(request.borrower.netWorth),
    experienceYears: request.borrower.experienceYears,
  };
}
