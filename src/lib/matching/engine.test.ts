import { describe, expect, it } from "vitest";
import { bestMatchPerLender, rankLendersForRequest, scoreLoanRequestAgainstProgram } from "./engine";
import type { MatchableLender, MatchableLoanProgram, MatchableLoanRequest } from "./types";

function makeLender(overrides: Partial<MatchableLender> = {}): MatchableLender {
  return {
    id: "lender-1",
    companyName: "ABC Capital",
    states: ["NJ", "NY", "PA"],
    propertyTypes: ["MULTIFAMILY", "MIXED_USE"],
    minLoanAmount: 500_000,
    maxLoanAmount: 10_000_000,
    maxLtc: 80,
    maxLtv: 75,
    minDscr: 1.2,
    minCreditScore: 680,
    recourse: "EITHER",
    requiredExperienceYears: 2,
    sponsorNetWorthRequirement: 500_000,
    liquidityRequirement: 100_000,
    closingTimelineDays: 30,
    isActive: true,
    allowsBridge: true,
    allowsDscr: true,
    allowsConstruction: false,
    allowsGroundUp: false,
    allowsFixFlip: false,
    allowsMultifamily: true,
    allowsMixedUse: true,
    allowsRetail: false,
    allowsOffice: false,
    allowsIndustrial: false,
    allowsSelfStorage: false,
    allowsHospitality: false,
    allowsLand: false,
    ...overrides,
  };
}

function makeProgram(overrides: Partial<MatchableLoanProgram> = {}): MatchableLoanProgram {
  return {
    id: "program-1",
    programName: "Bridge 12mo",
    loanType: "BRIDGE",
    purposes: ["BRIDGE", "PURCHASE", "REFINANCE"],
    minLoanAmount: 500_000,
    maxLoanAmount: 10_000_000,
    minDscr: 1.2,
    maxLtv: 75,
    maxLtc: 80,
    propertyTypes: ["MULTIFAMILY", "MIXED_USE"],
    allowedStates: ["NJ", "NY", "PA"],
    isBridge: true,
    isPermanent: false,
    isConstruction: false,
    isValueAdd: true,
    isGroundUp: false,
    isFixFlip: false,
    isRentalPortfolio: false,
    isCommercial: true,
    isResidential: false,
    isActive: true,
    ...overrides,
  };
}

function makeRequest(overrides: Partial<MatchableLoanRequest> = {}): MatchableLoanRequest {
  return {
    requestedLoanAmount: 2_000_000,
    purchasePrice: 2_500_000,
    propertyValue: 2_700_000,
    ltv: 70,
    ltc: 75,
    dscr: 1.35,
    propertyType: "MULTIFAMILY",
    propertyState: "NJ",
    loanPurpose: "BRIDGE",
    creditScore: 720,
    liquidity: 250_000,
    netWorth: 1_500_000,
    experienceYears: 5,
    timelineDays: 45,
    ...overrides,
  };
}

describe("scoreLoanRequestAgainstProgram", () => {
  it("scores a strong fit near the top of the range and reports no disqualifiers", () => {
    const result = scoreLoanRequestAgainstProgram(makeRequest(), makeLender(), makeProgram());
    expect(result.eligible).toBe(true);
    expect(result.disqualifiers).toHaveLength(0);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.matches).toContain("Loan amount fits");
    expect(result.matches).toContain("DSCR qualifies");
    expect(result.matches).toContain("Property type accepted");
    expect(result.matches).toContain("State accepted");
    expect(result.matches).toContain("LTV below max");
  });

  it("disqualifies and caps the score when the property state isn't served", () => {
    const result = scoreLoanRequestAgainstProgram(makeRequest({ propertyState: "TX" }), makeLender(), makeProgram());
    expect(result.eligible).toBe(false);
    expect(result.disqualifiers.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(30);
  });

  it("disqualifies when the loan amount is far outside the program's range", () => {
    const result = scoreLoanRequestAgainstProgram(
      makeRequest({ requestedLoanAmount: 50_000_000 }),
      makeLender(),
      makeProgram(),
    );
    expect(result.eligible).toBe(false);
    expect(result.disqualifiers.some((d) => d.toLowerCase().includes("loan amount"))).toBe(true);
  });

  it("still marks the request eligible with warnings for soft shortfalls (credit score, liquidity)", () => {
    const result = scoreLoanRequestAgainstProgram(
      makeRequest({ creditScore: 660, liquidity: 90_000 }),
      makeLender(),
      makeProgram(),
    );
    expect(result.eligible).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
    expect(result.score).toBeGreaterThan(30);
  });

  it("disqualifies when the lender doesn't offer the requested loan purpose capability", () => {
    const result = scoreLoanRequestAgainstProgram(
      makeRequest({ loanPurpose: "CONSTRUCTION" }),
      makeLender({ allowsConstruction: false }),
      makeProgram({ purposes: ["CONSTRUCTION"], isConstruction: false }),
    );
    expect(result.eligible).toBe(false);
  });

  it("treats missing optional program thresholds (DSCR/LTV/LTC) as not applicable rather than penalizing", () => {
    const result = scoreLoanRequestAgainstProgram(
      makeRequest(),
      makeLender({ minDscr: null, maxLtv: null, maxLtc: null }),
      makeProgram({ minDscr: null, maxLtv: null, maxLtc: null }),
    );
    expect(result.criteria.find((c) => c.key === "dscr")?.message).toBe("DSCR not applicable");
    expect(result.eligible).toBe(true);
  });
});

describe("rankLendersForRequest / bestMatchPerLender", () => {
  it("ranks best-first and skips inactive lenders/programs", () => {
    const request = makeRequest();
    const results = rankLendersForRequest(request, [
      { lender: makeLender({ id: "l1", companyName: "ABC Capital" }), programs: [makeProgram({ id: "p1" })] },
      {
        lender: makeLender({ id: "l2", companyName: "XYZ Lending", minCreditScore: 760, liquidityRequirement: 500_000 }),
        programs: [makeProgram({ id: "p2" })],
      },
      {
        lender: makeLender({ id: "l3", companyName: "Inactive Capital", isActive: false }),
        programs: [makeProgram({ id: "p3" })],
      },
    ]);

    expect(results.map((r) => r.lenderId)).not.toContain("l3");
    expect(results[0].score).toBeGreaterThanOrEqual(results[results.length - 1].score);
    expect(results[0].companyName).toBe("ABC Capital");
  });

  it("collapses multiple programs per lender to the single best score", () => {
    const request = makeRequest();
    const ranked = rankLendersForRequest(request, [
      {
        lender: makeLender({ id: "l1" }),
        programs: [
          makeProgram({ id: "p1", maxLoanAmount: 1_000_000 }), // request amount (2M) far above -> weak fit
          makeProgram({ id: "p2" }), // strong fit
        ],
      },
    ]);
    const best = bestMatchPerLender(ranked);
    expect(best).toHaveLength(1);
    expect(best[0].programId).toBe("p2");
  });
});
