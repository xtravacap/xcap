import type { LoanPurpose, LoanType, OccupancyType, PropertyType, RecourseType } from "@prisma/client";

/**
 * Plain-value input to the matching engine. Deliberately decoupled from Prisma's
 * generated types (Decimal, nullable relations, etc.) so the engine stays a pure,
 * fast-to-test function of primitives. Callers (API routes, seed scripts) are
 * responsible for mapping Prisma rows into these shapes.
 */
export interface MatchableLoanRequest {
  requestedLoanAmount: number;
  purchasePrice?: number | null;
  propertyValue?: number | null;
  ltv?: number | null;
  ltc?: number | null;
  dscr?: number | null;
  propertyType: PropertyType;
  propertyState: string;
  occupancy?: OccupancyType | null;
  loanPurpose: LoanPurpose;
  recoursePreference?: RecourseType | null;
  timelineDays?: number | null;

  // Borrower / sponsor attributes relevant to underwriting fit.
  creditScore?: number | null;
  liquidity?: number | null;
  netWorth?: number | null;
  experienceYears?: number | null;
}

export interface MatchableLender {
  id: string;
  companyName: string;
  states: string[];
  propertyTypes: PropertyType[];
  minLoanAmount: number;
  maxLoanAmount: number;
  maxLtc?: number | null;
  maxLtv?: number | null;
  minDscr?: number | null;
  minCreditScore?: number | null;
  recourse: RecourseType;
  requiredExperienceYears?: number | null;
  sponsorNetWorthRequirement?: number | null;
  liquidityRequirement?: number | null;
  closingTimelineDays?: number | null;
  isActive: boolean;

  allowsBridge: boolean;
  allowsDscr: boolean;
  allowsConstruction: boolean;
  allowsGroundUp: boolean;
  allowsFixFlip: boolean;
  allowsMultifamily: boolean;
  allowsMixedUse: boolean;
  allowsRetail: boolean;
  allowsOffice: boolean;
  allowsIndustrial: boolean;
  allowsSelfStorage: boolean;
  allowsHospitality: boolean;
  allowsLand: boolean;
}

export interface MatchableLoanProgram {
  id: string;
  programName: string;
  loanType: LoanType;
  purposes: LoanPurpose[];
  minLoanAmount: number;
  maxLoanAmount: number;
  minDscr?: number | null;
  maxLtv?: number | null;
  maxLtc?: number | null;
  propertyTypes: PropertyType[];
  allowedStates: string[];
  isBridge: boolean;
  isPermanent: boolean;
  isConstruction: boolean;
  isValueAdd: boolean;
  isGroundUp: boolean;
  isFixFlip: boolean;
  isRentalPortfolio: boolean;
  isCommercial: boolean;
  isResidential: boolean;
  isActive: boolean;
}

export type CriterionStatus = "match" | "warning" | "disqualifier" | "neutral";

export interface CriterionResult {
  key: string;
  label: string;
  weight: number;
  value: number; // 0..1 fit score for this criterion
  status: CriterionStatus;
  message: string;
}

export interface MatchResult {
  lenderId: string;
  programId: string;
  score: number; // 0..100
  eligible: boolean;
  criteria: CriterionResult[];
  matches: string[];
  warnings: string[];
  disqualifiers: string[];
}
