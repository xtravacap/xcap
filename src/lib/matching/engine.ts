import type { LoanPurpose, PropertyType } from "@prisma/client";
import type {
  CriterionResult,
  CriterionStatus,
  MatchResult,
  MatchableLender,
  MatchableLoanProgram,
  MatchableLoanRequest,
} from "./types";

/**
 * Relative importance of each criterion. Values don't need to sum to 100 —
 * the final score is `100 * (Σ weight·value) / Σ weight`, so weights are
 * just ratios. Kept in one place because product/underwriting will want to
 * tune these without touching scoring logic.
 */
export const CRITERION_WEIGHTS = {
  loanAmount: 14,
  propertyType: 12,
  state: 10,
  dscr: 10,
  ltv: 9,
  ltc: 8,
  creditScore: 8,
  purpose: 7,
  loanTypeCapability: 6,
  liquidity: 6,
  experience: 5,
  assetClass: 3,
  timeline: 3,
  recourse: 3,
} as const;

/** Criteria whose failure caps the overall score — a lender that can't
 * legally/structurally do the deal shouldn't rank near the top no matter how
 * well the "soft" underwriting boxes are checked. */
const HARD_CRITERIA = new Set<keyof typeof CRITERION_WEIGHTS>([
  "state",
  "propertyType",
  "loanAmount",
  "purpose",
  "loanTypeCapability",
]);

const DISQUALIFIED_SCORE_CAP = 30;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** 1.0 inside [min, max]; degrades linearly outside up to `tolerance` (as a
 * fraction of the range width), then 0. */
function fitRange(value: number, min: number, max: number, tolerance = 0.15): number {
  if (value >= min && value <= max) return 1;
  const span = Math.max(max - min, 1);
  const distance = value < min ? min - value : value - max;
  const fraction = distance / span;
  if (fraction >= tolerance) return 0;
  return clamp01(1 - fraction / tolerance);
}

/** 1.0 when value >= min; degrades linearly as value falls short, by up to
 * `tolerance` fraction of `min`, then 0. */
function atLeast(value: number, min: number, tolerance = 0.2): number {
  if (min <= 0) return 1;
  if (value >= min) return 1;
  const shortfall = (min - value) / min;
  if (shortfall >= tolerance) return 0;
  return clamp01(1 - shortfall / tolerance);
}

/** 1.0 when value <= max; degrades linearly as value exceeds, by up to
 * `tolerance` fraction of `max`, then 0. */
function atMost(value: number, max: number, tolerance = 0.2): number {
  if (max <= 0) return 1;
  if (value <= max) return 1;
  const overage = (value - max) / max;
  if (overage >= tolerance) return 0;
  return clamp01(1 - overage / tolerance);
}

const RESIDENTIAL_PROPERTY_TYPES = new Set<PropertyType>(["SINGLE_FAMILY"]);

/** Maps a loan purpose (what the borrower needs) to the lender/program
 * capability flag that must be true for the lender to structurally do it. */
function capabilityFitForPurpose(
  purpose: LoanPurpose,
  lender: MatchableLender,
  program: MatchableLoanProgram,
): { value: number; label: string } {
  switch (purpose) {
    case "BRIDGE":
      return { value: lender.allowsBridge || program.isBridge ? 1 : 0, label: "Bridge financing" };
    case "DSCR":
      return { value: lender.allowsDscr ? 1 : 0, label: "DSCR program" };
    case "CONSTRUCTION":
      return {
        value: lender.allowsConstruction || program.isConstruction ? 1 : 0,
        label: "Construction financing",
      };
    case "GROUND_UP":
      return { value: lender.allowsGroundUp || program.isGroundUp ? 1 : 0, label: "Ground-up construction" };
    case "FIX_AND_FLIP":
      return { value: lender.allowsFixFlip || program.isFixFlip ? 1 : 0, label: "Fix & flip financing" };
    case "PURCHASE":
    case "REFINANCE":
    case "CASH_OUT":
      return { value: program.isPermanent || program.isBridge ? 1 : 0.6, label: "Permanent/refinance financing" };
    default:
      return { value: 1, label: "Loan purpose" };
  }
}

const PROPERTY_TYPE_FLAG: Partial<Record<PropertyType, keyof MatchableLender>> = {
  MULTIFAMILY: "allowsMultifamily",
  MIXED_USE: "allowsMixedUse",
  RETAIL: "allowsRetail",
  OFFICE: "allowsOffice",
  INDUSTRIAL: "allowsIndustrial",
  SELF_STORAGE: "allowsSelfStorage",
  HOSPITALITY: "allowsHospitality",
  LAND: "allowsLand",
};

function capabilityFitForPropertyType(propertyType: PropertyType, lender: MatchableLender): number | null {
  const flag = PROPERTY_TYPE_FLAG[propertyType];
  if (!flag) return null; // no explicit checklist flag for this asset class (e.g. SINGLE_FAMILY)
  return lender[flag] ? 1 : 0;
}

function push(
  criteria: CriterionResult[],
  matches: string[],
  warnings: string[],
  disqualifiers: string[],
  result: CriterionResult,
) {
  criteria.push(result);
  if (result.status === "match") matches.push(result.message);
  else if (result.status === "warning") warnings.push(result.message);
  else if (result.status === "disqualifier") disqualifiers.push(result.message);
}

function statusFor(value: number, isHard: boolean): CriterionStatus {
  if (value >= 0.999) return "match";
  if (value <= 0) return isHard ? "disqualifier" : "warning";
  return "warning";
}

/**
 * Scores a single loan request against a single lender program, returning a
 * 0-100 compatibility score plus human-readable reasons (✔ matches / ⚠
 * warnings / disqualifiers) suitable for direct display on the matches
 * dashboard.
 */
export function scoreLoanRequestAgainstProgram(
  request: MatchableLoanRequest,
  lender: MatchableLender,
  program: MatchableLoanProgram,
): MatchResult {
  const criteria: CriterionResult[] = [];
  const matches: string[] = [];
  const warnings: string[] = [];
  const disqualifiers: string[] = [];

  const add = (key: keyof typeof CRITERION_WEIGHTS, label: string, value: number, message: string) => {
    const isHard = HARD_CRITERIA.has(key);
    push(criteria, matches, warnings, disqualifiers, {
      key,
      label,
      weight: CRITERION_WEIGHTS[key],
      value,
      status: statusFor(value, isHard),
      message,
    });
  };

  // --- State ---
  const allowedStates = program.allowedStates.length > 0 ? program.allowedStates : lender.states;
  const stateOk = allowedStates.length === 0 || allowedStates.includes(request.propertyState);
  add("state", "State", stateOk ? 1 : 0, stateOk ? "State accepted" : `Not licensed/active in ${request.propertyState}`);

  // --- Property type ---
  const allowedPropertyTypes = program.propertyTypes.length > 0 ? program.propertyTypes : lender.propertyTypes;
  const propertyTypeListed = allowedPropertyTypes.length === 0 || allowedPropertyTypes.includes(request.propertyType);
  const propertyCapability = capabilityFitForPropertyType(request.propertyType, lender);
  const propertyTypeOk = propertyTypeListed && propertyCapability !== 0;
  add(
    "propertyType",
    "Property type",
    propertyTypeOk ? 1 : 0,
    propertyTypeOk ? "Property type accepted" : "Property type not accepted",
  );

  // --- Loan amount ---
  const amountFit = fitRange(request.requestedLoanAmount, program.minLoanAmount, program.maxLoanAmount);
  add(
    "loanAmount",
    "Loan amount",
    amountFit,
    amountFit >= 1
      ? "Loan amount fits"
      : amountFit > 0
        ? "Loan amount slightly outside preferred range"
        : "Loan amount outside lender's range",
  );

  // --- DSCR ---
  const minDscr = program.minDscr ?? lender.minDscr;
  if (minDscr != null && request.dscr != null) {
    const dscrFit = atLeast(request.dscr, minDscr);
    add("dscr", "DSCR", dscrFit, dscrFit >= 1 ? "DSCR qualifies" : dscrFit > 0 ? "DSCR slightly below preference" : "DSCR below minimum");
  } else {
    add("dscr", "DSCR", 1, "DSCR not applicable");
  }

  // --- LTV ---
  const maxLtv = program.maxLtv ?? lender.maxLtv;
  if (maxLtv != null && request.ltv != null) {
    const ltvFit = atMost(request.ltv, maxLtv);
    add("ltv", "LTV", ltvFit, ltvFit >= 1 ? "LTV below max" : ltvFit > 0 ? "LTV slightly above preference" : "LTV exceeds maximum");
  } else {
    add("ltv", "LTV", 1, "LTV not applicable");
  }

  // --- LTC ---
  const maxLtc = program.maxLtc ?? lender.maxLtc;
  if (maxLtc != null && request.ltc != null) {
    const ltcFit = atMost(request.ltc, maxLtc);
    add("ltc", "LTC", ltcFit, ltcFit >= 1 ? "LTC below max" : ltcFit > 0 ? "LTC slightly above preference" : "LTC exceeds maximum");
  } else {
    add("ltc", "LTC", 1, "LTC not applicable");
  }

  // --- Credit score ---
  if (lender.minCreditScore != null && request.creditScore != null) {
    const creditFit = atLeast(request.creditScore, lender.minCreditScore, 0.1);
    add(
      "creditScore",
      "Credit score",
      creditFit,
      creditFit >= 1 ? "Sponsor credit qualifies" : creditFit > 0 ? "Credit score slightly below preference" : "Credit score below minimum",
    );
  } else {
    add("creditScore", "Credit score", 1, "Credit score not applicable");
  }

  // --- Liquidity ---
  if (lender.liquidityRequirement != null && request.liquidity != null) {
    const liquidityFit = atLeast(request.liquidity, lender.liquidityRequirement);
    add(
      "liquidity",
      "Liquidity",
      liquidityFit,
      liquidityFit >= 1 ? "Sponsor liquidity qualifies" : liquidityFit > 0 ? "Liquidity lower than ideal" : "Liquidity below requirement",
    );
  } else {
    add("liquidity", "Liquidity", 1, "Liquidity not applicable");
  }

  // --- Experience ---
  if (lender.requiredExperienceYears != null && request.experienceYears != null) {
    const expFit = atLeast(request.experienceYears, lender.requiredExperienceYears, 0.5);
    add(
      "experience",
      "Sponsor experience",
      expFit,
      expFit >= 1 ? "Sponsor experience qualifies" : expFit > 0 ? "Experience slightly below preference" : "Experience below requirement",
    );
  } else {
    add("experience", "Sponsor experience", 1, "Experience not applicable");
  }

  // --- Purpose ---
  const purposeOk = program.purposes.length === 0 || program.purposes.includes(request.loanPurpose);
  add("purpose", "Loan purpose", purposeOk ? 1 : 0, purposeOk ? "Loan purpose matches program" : "Program doesn't cover this loan purpose");

  // --- Loan type capability (construction allowed, bridge allowed, etc.) ---
  const purposeCapability = capabilityFitForPurpose(request.loanPurpose, lender, program);
  add(
    "loanTypeCapability",
    "Loan type capability",
    purposeCapability.value,
    purposeCapability.value >= 1
      ? `${purposeCapability.label} accepted`
      : purposeCapability.value > 0
        ? `Partial fit for ${purposeCapability.label.toLowerCase()}`
        : `Lender does not offer ${purposeCapability.label.toLowerCase()}`,
  );

  // --- Asset class (commercial vs. residential alignment) ---
  const isResidentialAsset = RESIDENTIAL_PROPERTY_TYPES.has(request.propertyType);
  if (program.isCommercial || program.isResidential) {
    const assetOk = isResidentialAsset ? program.isResidential : program.isCommercial;
    add("assetClass", "Asset class", assetOk ? 1 : 0.3, assetOk ? "Asset class accepted" : "Asset class outside program focus");
  } else {
    add("assetClass", "Asset class", 1, "Asset class not restricted");
  }

  // --- Timeline ---
  if (lender.closingTimelineDays != null && request.timelineDays != null) {
    const timelineOk = lender.closingTimelineDays <= request.timelineDays;
    const timelineFit = timelineOk
      ? 1
      : clamp01(1 - (lender.closingTimelineDays - request.timelineDays) / Math.max(request.timelineDays, 1));
    add(
      "timeline",
      "Closing timeline",
      timelineFit,
      timelineFit >= 1 ? "Can close within timeline" : "Lender's typical closing timeline is tight for this deal",
    );
  } else {
    add("timeline", "Closing timeline", 1, "Timeline not specified");
  }

  // --- Recourse preference ---
  if (request.recoursePreference && lender.recourse !== "EITHER" && request.recoursePreference !== "EITHER") {
    const recourseOk = lender.recourse === request.recoursePreference;
    add(
      "recourse",
      "Recourse",
      recourseOk ? 1 : 0.4,
      recourseOk ? "Recourse preference matches" : "Lender's recourse stance differs from borrower preference",
    );
  } else {
    add("recourse", "Recourse", 1, "Recourse preference flexible");
  }

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = criteria.reduce((sum, c) => sum + c.weight * c.value, 0);
  let score = Math.round((weightedSum / totalWeight) * 100);

  const hasDisqualifier = disqualifiers.length > 0;
  if (hasDisqualifier) {
    score = Math.min(score, DISQUALIFIED_SCORE_CAP);
  }
  score = Math.max(0, Math.min(100, score));

  return {
    lenderId: lender.id,
    programId: program.id,
    score,
    eligible: !hasDisqualifier,
    criteria,
    matches,
    warnings,
    disqualifiers,
  };
}

export interface RankedLenderMatch extends MatchResult {
  programName: string;
  companyName: string;
}

/**
 * Scores a loan request against every active program from every active
 * lender, and returns results ranked best-first. Each lender may appear
 * multiple times (once per program) — callers that want one row per lender
 * should dedupe by keeping the highest-scoring program via
 * `bestMatchPerLender`.
 */
export function rankLendersForRequest(
  request: MatchableLoanRequest,
  lenders: Array<{ lender: MatchableLender; programs: MatchableLoanProgram[] }>,
): RankedLenderMatch[] {
  const results: RankedLenderMatch[] = [];
  for (const { lender, programs } of lenders) {
    if (!lender.isActive) continue;
    for (const program of programs) {
      if (!program.isActive) continue;
      const result = scoreLoanRequestAgainstProgram(request, lender, program);
      results.push({ ...result, programName: program.programName, companyName: lender.companyName });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

/** Collapses a multi-program ranking down to the single best program per lender. */
export function bestMatchPerLender(ranked: RankedLenderMatch[]): RankedLenderMatch[] {
  const best = new Map<string, RankedLenderMatch>();
  for (const result of ranked) {
    const existing = best.get(result.lenderId);
    if (!existing || result.score > existing.score) {
      best.set(result.lenderId, result);
    }
  }
  return Array.from(best.values()).sort((a, b) => b.score - a.score);
}
