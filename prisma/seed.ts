/**
 * Seeds a realistic demo dataset: one org, an admin + lender + borrower user
 * each (with placeholder Clerk IDs — see README for how to link them to real
 * Clerk accounts), ~10 lenders with 2 programs apiece, 8 borrowers each with
 * a loan request, and the matching engine run for every request so the
 * Matches dashboard has ranked data to show on first login.
 */
import { PrismaClient, type LoanPurpose, type LoanType, type PropertyType, type RecourseType } from "@prisma/client";
import { runMatchingForLoanRequest } from "../src/lib/matching/run";

const prisma = new PrismaClient();

const ORG_SLUG = "xtrava-capital";

interface LenderSeed {
  companyName: string;
  primaryContact: string;
  email: string;
  phone: string;
  website: string;
  loanTypes: LoanType[];
  propertyTypes: PropertyType[];
  states: string[];
  minLoanAmount: number;
  maxLoanAmount: number;
  maxLtc: number;
  maxLtv: number;
  minDscr: number;
  minCreditScore: number;
  recourse: RecourseType;
  interestRateMin: number;
  interestRateMax: number;
  originationFeeMin: number;
  originationFeeMax: number;
  allowsBridge?: boolean;
  allowsDscr?: boolean;
  allowsConstruction?: boolean;
  allowsGroundUp?: boolean;
  allowsFixFlip?: boolean;
  allowsMultifamily?: boolean;
  allowsMixedUse?: boolean;
  allowsRetail?: boolean;
  allowsOffice?: boolean;
  allowsIndustrial?: boolean;
  allowsSelfStorage?: boolean;
  allowsHospitality?: boolean;
  allowsLand?: boolean;
  preferredMarkets: string[];
  requiredExperienceYears: number;
  sponsorNetWorthRequirement: number;
  liquidityRequirement: number;
  entityRequirements: string;
  prepaymentPenalty: string;
  closingTimelineDays: number;
  notes: string;
  programs: {
    programName: string;
    loanType: LoanType;
    purposes: LoanPurpose[];
    minLoanAmount: number;
    maxLoanAmount: number;
    minDscr?: number;
    maxLtv?: number;
    maxLtc?: number;
    interestRateMin?: number;
    interestRateMax?: number;
    termMonths?: number;
    amortizationMonths?: number;
    prepayment?: string;
    interestOnly?: boolean;
    propertyTypes: PropertyType[];
    allowedStates: string[];
    isBridge?: boolean;
    isPermanent?: boolean;
    isConstruction?: boolean;
    isValueAdd?: boolean;
    isGroundUp?: boolean;
    isFixFlip?: boolean;
    isRentalPortfolio?: boolean;
    isCommercial?: boolean;
    isResidential?: boolean;
  }[];
}

const NORTHEAST = ["NJ", "NY", "PA", "CT", "MA"];
const SOUTHEAST = ["FL", "GA", "NC", "SC", "TN"];
const SOUTHWEST = ["TX", "AZ", "NV", "NM"];
const WEST = ["CA", "OR", "WA"];

const LENDERS: LenderSeed[] = [
  {
    companyName: "ABC Capital Partners",
    primaryContact: "Rachel Simmons",
    email: "rachel@abccapitalpartners.com",
    phone: "212-555-0101",
    website: "https://abccapitalpartners.com",
    loanTypes: ["BRIDGE", "DSCR", "VALUE_ADD"],
    propertyTypes: ["MULTIFAMILY", "MIXED_USE", "RETAIL"],
    states: NORTHEAST,
    minLoanAmount: 500_000,
    maxLoanAmount: 15_000_000,
    maxLtc: 85,
    maxLtv: 75,
    minDscr: 1.15,
    minCreditScore: 660,
    recourse: "EITHER",
    interestRateMin: 8,
    interestRateMax: 11,
    originationFeeMin: 1,
    originationFeeMax: 2,
    allowsBridge: true,
    allowsDscr: true,
    allowsMultifamily: true,
    allowsMixedUse: true,
    allowsRetail: true,
    preferredMarkets: ["Northern NJ", "NYC Metro", "Philadelphia"],
    requiredExperienceYears: 2,
    sponsorNetWorthRequirement: 500_000,
    liquidityRequirement: 100_000,
    entityRequirements: "Single-purpose LLC required at closing",
    prepaymentPenalty: "None on bridge; 1% on DSCR before year 2",
    closingTimelineDays: 25,
    notes: "Fast bridge execution; strong relationship with NJ/NY sponsors.",
    programs: [
      {
        programName: "Bridge 12-24mo",
        loanType: "BRIDGE",
        purposes: ["PURCHASE", "REFINANCE", "BRIDGE"],
        minLoanAmount: 500_000,
        maxLoanAmount: 15_000_000,
        minDscr: 1.1,
        maxLtv: 75,
        maxLtc: 85,
        interestRateMin: 8.5,
        interestRateMax: 11,
        termMonths: 18,
        interestOnly: true,
        prepayment: "None",
        propertyTypes: ["MULTIFAMILY", "MIXED_USE", "RETAIL"],
        allowedStates: NORTHEAST,
        isBridge: true,
        isValueAdd: true,
        isCommercial: true,
      },
      {
        programName: "DSCR Rental 30yr",
        loanType: "DSCR",
        purposes: ["PURCHASE", "REFINANCE", "CASH_OUT", "DSCR"],
        minLoanAmount: 500_000,
        maxLoanAmount: 5_000_000,
        minDscr: 1.2,
        maxLtv: 75,
        maxLtc: 75,
        interestRateMin: 7.5,
        interestRateMax: 9,
        termMonths: 360,
        amortizationMonths: 360,
        prepayment: "5-4-3-2-1 step down",
        propertyTypes: ["MULTIFAMILY", "MIXED_USE"],
        allowedStates: NORTHEAST,
        isPermanent: true,
        isRentalPortfolio: true,
        isCommercial: true,
      },
    ],
  },
  {
    companyName: "XYZ Lending Group",
    primaryContact: "Marcus Chen",
    email: "marcus@xyzlending.com",
    phone: "305-555-0102",
    website: "https://xyzlending.com",
    loanTypes: ["DSCR", "RENTAL_PORTFOLIO"],
    propertyTypes: ["SINGLE_FAMILY", "MULTIFAMILY"],
    states: [...NORTHEAST, ...SOUTHEAST, ...SOUTHWEST],
    minLoanAmount: 100_000,
    maxLoanAmount: 3_000_000,
    maxLtc: 80,
    maxLtv: 80,
    minDscr: 1.0,
    minCreditScore: 680,
    recourse: "NON_RECOURSE",
    interestRateMin: 7,
    interestRateMax: 9.5,
    originationFeeMin: 1,
    originationFeeMax: 1.5,
    allowsDscr: true,
    allowsMultifamily: true,
    preferredMarkets: ["Sunbelt secondary markets"],
    requiredExperienceYears: 0,
    sponsorNetWorthRequirement: 150_000,
    liquidityRequirement: 40_000,
    entityRequirements: "LLC preferred, individual borrowers accepted",
    prepaymentPenalty: "3-2-1 step down",
    closingTimelineDays: 21,
    notes: "High-volume DSCR shop, great for first-time investors.",
    programs: [
      {
        programName: "DSCR Rental Portfolio",
        loanType: "DSCR",
        purposes: ["PURCHASE", "REFINANCE", "CASH_OUT", "DSCR"],
        minLoanAmount: 100_000,
        maxLoanAmount: 3_000_000,
        minDscr: 1.0,
        maxLtv: 80,
        maxLtc: 80,
        interestRateMin: 7,
        interestRateMax: 9.5,
        termMonths: 360,
        amortizationMonths: 360,
        prepayment: "3-2-1 step down",
        propertyTypes: ["SINGLE_FAMILY", "MULTIFAMILY"],
        allowedStates: [...NORTHEAST, ...SOUTHEAST, ...SOUTHWEST],
        isPermanent: true,
        isRentalPortfolio: true,
        isResidential: true,
      },
    ],
  },
  {
    companyName: "Summit Bridge Partners",
    primaryContact: "Danielle Osei",
    email: "danielle@summitbridge.com",
    phone: "404-555-0103",
    website: "https://summitbridge.com",
    loanTypes: ["BRIDGE", "FIX_AND_FLIP"],
    propertyTypes: ["SINGLE_FAMILY", "MULTIFAMILY"],
    states: SOUTHEAST,
    minLoanAmount: 250_000,
    maxLoanAmount: 5_000_000,
    maxLtc: 90,
    maxLtv: 70,
    minDscr: 1.0,
    minCreditScore: 640,
    recourse: "RECOURSE",
    interestRateMin: 9.5,
    interestRateMax: 12.5,
    originationFeeMin: 2,
    originationFeeMax: 3,
    allowsBridge: true,
    allowsFixFlip: true,
    allowsMultifamily: true,
    preferredMarkets: ["Atlanta", "Charlotte", "Tampa"],
    requiredExperienceYears: 1,
    sponsorNetWorthRequirement: 250_000,
    liquidityRequirement: 50_000,
    entityRequirements: "LLC required",
    prepaymentPenalty: "None",
    closingTimelineDays: 14,
    notes: "Aggressive leverage for value-add and fix & flip sponsors.",
    programs: [
      {
        programName: "Fix & Flip Fast-Close",
        loanType: "FIX_AND_FLIP",
        purposes: ["PURCHASE", "FIX_AND_FLIP"],
        minLoanAmount: 250_000,
        maxLoanAmount: 2_000_000,
        maxLtv: 70,
        maxLtc: 90,
        interestRateMin: 10,
        interestRateMax: 12.5,
        termMonths: 12,
        interestOnly: true,
        prepayment: "None",
        propertyTypes: ["SINGLE_FAMILY"],
        allowedStates: SOUTHEAST,
        isFixFlip: true,
        isResidential: true,
      },
      {
        programName: "Multifamily Bridge",
        loanType: "BRIDGE",
        purposes: ["PURCHASE", "BRIDGE"],
        minLoanAmount: 1_000_000,
        maxLoanAmount: 5_000_000,
        minDscr: 1.0,
        maxLtv: 70,
        maxLtc: 85,
        interestRateMin: 9.5,
        interestRateMax: 11.5,
        termMonths: 18,
        interestOnly: true,
        propertyTypes: ["MULTIFAMILY"],
        allowedStates: SOUTHEAST,
        isBridge: true,
        isValueAdd: true,
        isCommercial: true,
      },
    ],
  },
  {
    companyName: "Ironclad Construction Capital",
    primaryContact: "Peter Vance",
    email: "peter@ironcladcc.com",
    phone: "602-555-0104",
    website: "https://ironcladcc.com",
    loanTypes: ["CONSTRUCTION", "GROUND_UP"],
    propertyTypes: ["MULTIFAMILY", "INDUSTRIAL"],
    states: [...SOUTHWEST, ...WEST],
    minLoanAmount: 2_000_000,
    maxLoanAmount: 50_000_000,
    maxLtc: 75,
    maxLtv: 65,
    minDscr: 1.25,
    minCreditScore: 700,
    recourse: "RECOURSE",
    interestRateMin: 9,
    interestRateMax: 11,
    originationFeeMin: 1,
    originationFeeMax: 2,
    allowsConstruction: true,
    allowsGroundUp: true,
    allowsMultifamily: true,
    allowsIndustrial: true,
    preferredMarkets: ["Phoenix", "Las Vegas", "Inland Empire"],
    requiredExperienceYears: 5,
    sponsorNetWorthRequirement: 3_000_000,
    liquidityRequirement: 750_000,
    entityRequirements: "Experienced GC required, payment & performance bond",
    prepaymentPenalty: "None during construction",
    closingTimelineDays: 45,
    notes: "Institutional-quality ground-up construction lender.",
    programs: [
      {
        programName: "Ground-Up Construction",
        loanType: "GROUND_UP",
        purposes: ["CONSTRUCTION", "GROUND_UP"],
        minLoanAmount: 5_000_000,
        maxLoanAmount: 50_000_000,
        maxLtc: 70,
        maxLtv: 60,
        interestRateMin: 9.5,
        interestRateMax: 11,
        termMonths: 24,
        propertyTypes: ["MULTIFAMILY", "INDUSTRIAL"],
        allowedStates: [...SOUTHWEST, ...WEST],
        isGroundUp: true,
        isConstruction: true,
        isCommercial: true,
      },
      {
        programName: "Value-Add Construction",
        loanType: "CONSTRUCTION",
        purposes: ["CONSTRUCTION"],
        minLoanAmount: 2_000_000,
        maxLoanAmount: 20_000_000,
        maxLtc: 75,
        maxLtv: 65,
        interestRateMin: 9,
        interestRateMax: 10.5,
        termMonths: 18,
        propertyTypes: ["MULTIFAMILY", "INDUSTRIAL"],
        allowedStates: [...SOUTHWEST, ...WEST],
        isConstruction: true,
        isValueAdd: true,
        isCommercial: true,
      },
    ],
  },
  {
    companyName: "Harbor Point Capital",
    primaryContact: "Nina Alvarez",
    email: "nina@harborpointcap.com",
    phone: "813-555-0105",
    website: "https://harborpointcap.com",
    loanTypes: ["BRIDGE", "VALUE_ADD"],
    propertyTypes: ["HOSPITALITY", "RETAIL"],
    states: [...SOUTHEAST, "CA"],
    minLoanAmount: 1_000_000,
    maxLoanAmount: 20_000_000,
    maxLtc: 70,
    maxLtv: 65,
    minDscr: 1.2,
    minCreditScore: 680,
    recourse: "NON_RECOURSE",
    interestRateMin: 8.5,
    interestRateMax: 10.5,
    originationFeeMin: 1,
    originationFeeMax: 2,
    allowsBridge: true,
    allowsHospitality: true,
    allowsRetail: true,
    preferredMarkets: ["Coastal FL", "Southern CA"],
    requiredExperienceYears: 3,
    sponsorNetWorthRequirement: 1_000_000,
    liquidityRequirement: 200_000,
    entityRequirements: "Hospitality management agreement required",
    prepaymentPenalty: "1% year 1",
    closingTimelineDays: 35,
    notes: "Specialty hospitality and retail bridge lender.",
    programs: [
      {
        programName: "Hospitality Bridge",
        loanType: "BRIDGE",
        purposes: ["PURCHASE", "REFINANCE", "BRIDGE"],
        minLoanAmount: 1_000_000,
        maxLoanAmount: 20_000_000,
        minDscr: 1.2,
        maxLtv: 65,
        maxLtc: 70,
        interestRateMin: 8.5,
        interestRateMax: 10.5,
        termMonths: 24,
        propertyTypes: ["HOSPITALITY"],
        allowedStates: [...SOUTHEAST, "CA"],
        isBridge: true,
        isValueAdd: true,
        isCommercial: true,
      },
    ],
  },
  {
    companyName: "Meridian Multifamily Fund",
    primaryContact: "Julia Whitfield",
    email: "julia@meridianmf.com",
    phone: "312-555-0106",
    website: "https://meridianmf.com",
    loanTypes: ["PERMANENT", "VALUE_ADD"],
    propertyTypes: ["MULTIFAMILY"],
    states: [...NORTHEAST, ...SOUTHEAST, ...SOUTHWEST, ...WEST, "IL", "OH", "MI"],
    minLoanAmount: 5_000_000,
    maxLoanAmount: 100_000_000,
    maxLtc: 65,
    maxLtv: 60,
    minDscr: 1.35,
    minCreditScore: 720,
    recourse: "NON_RECOURSE",
    interestRateMin: 6,
    interestRateMax: 7.5,
    originationFeeMin: 0.5,
    originationFeeMax: 1,
    allowsMultifamily: true,
    preferredMarkets: ["Top 25 MSAs"],
    requiredExperienceYears: 8,
    sponsorNetWorthRequirement: 10_000_000,
    liquidityRequirement: 2_000_000,
    entityRequirements: "Institutional sponsors only, audited financials",
    prepaymentPenalty: "Yield maintenance",
    closingTimelineDays: 60,
    notes: "Large balance permanent/value-add multifamily only.",
    programs: [
      {
        programName: "Permanent Multifamily 10yr",
        loanType: "PERMANENT",
        purposes: ["PURCHASE", "REFINANCE"],
        minLoanAmount: 5_000_000,
        maxLoanAmount: 100_000_000,
        minDscr: 1.35,
        maxLtv: 60,
        maxLtc: 60,
        interestRateMin: 6,
        interestRateMax: 7,
        termMonths: 120,
        amortizationMonths: 360,
        propertyTypes: ["MULTIFAMILY"],
        allowedStates: [...NORTHEAST, ...SOUTHEAST, ...SOUTHWEST, ...WEST, "IL", "OH", "MI"],
        isPermanent: true,
        isCommercial: true,
      },
      {
        programName: "Value-Add Bridge-to-Perm",
        loanType: "VALUE_ADD",
        purposes: ["PURCHASE", "BRIDGE"],
        minLoanAmount: 5_000_000,
        maxLoanAmount: 50_000_000,
        minDscr: 1.15,
        maxLtv: 65,
        maxLtc: 70,
        interestRateMin: 7,
        interestRateMax: 8.5,
        termMonths: 36,
        propertyTypes: ["MULTIFAMILY"],
        allowedStates: [...NORTHEAST, ...SOUTHEAST, ...SOUTHWEST, ...WEST, "IL", "OH", "MI"],
        isValueAdd: true,
        isCommercial: true,
      },
    ],
  },
  {
    companyName: "Anchor Storage Credit",
    primaryContact: "Tom Reilly",
    email: "tom@anchorstoragecredit.com",
    phone: "614-555-0107",
    website: "https://anchorstoragecredit.com",
    loanTypes: ["BRIDGE", "PERMANENT"],
    propertyTypes: ["SELF_STORAGE"],
    states: ["OH", "IN", "KY", "TN", "GA", "NC"],
    minLoanAmount: 1_000_000,
    maxLoanAmount: 15_000_000,
    maxLtc: 75,
    maxLtv: 70,
    minDscr: 1.25,
    minCreditScore: 680,
    recourse: "EITHER",
    interestRateMin: 7.5,
    interestRateMax: 9.5,
    originationFeeMin: 1,
    originationFeeMax: 1.5,
    allowsBridge: true,
    allowsSelfStorage: true,
    preferredMarkets: ["Midwest", "Southeast secondary markets"],
    requiredExperienceYears: 2,
    sponsorNetWorthRequirement: 750_000,
    liquidityRequirement: 150_000,
    entityRequirements: "LLC required",
    prepaymentPenalty: "2% year 1, 1% year 2",
    closingTimelineDays: 30,
    notes: "Self-storage specialist across the Midwest/Southeast.",
    programs: [
      {
        programName: "Self-Storage Bridge/Perm",
        loanType: "BRIDGE",
        purposes: ["PURCHASE", "REFINANCE", "BRIDGE"],
        minLoanAmount: 1_000_000,
        maxLoanAmount: 15_000_000,
        minDscr: 1.25,
        maxLtv: 70,
        maxLtc: 75,
        interestRateMin: 7.5,
        interestRateMax: 9.5,
        termMonths: 60,
        propertyTypes: ["SELF_STORAGE"],
        allowedStates: ["OH", "IN", "KY", "TN", "GA", "NC"],
        isBridge: true,
        isPermanent: true,
        isCommercial: true,
      },
    ],
  },
  {
    companyName: "Crestline Mezzanine Partners",
    primaryContact: "Sophia Lindqvist",
    email: "sophia@crestlinemezz.com",
    phone: "646-555-0108",
    website: "https://crestlinemezz.com",
    loanTypes: ["MEZZANINE", "VALUE_ADD"],
    propertyTypes: ["OFFICE", "MIXED_USE", "MULTIFAMILY"],
    states: [...NORTHEAST, "IL", "TX"],
    minLoanAmount: 2_000_000,
    maxLoanAmount: 25_000_000,
    maxLtc: 90,
    maxLtv: 85,
    minDscr: 1.05,
    minCreditScore: 680,
    recourse: "NON_RECOURSE",
    interestRateMin: 11,
    interestRateMax: 14,
    originationFeeMin: 1.5,
    originationFeeMax: 2.5,
    allowsMixedUse: true,
    allowsOffice: true,
    allowsMultifamily: true,
    preferredMarkets: ["Gateway markets"],
    requiredExperienceYears: 5,
    sponsorNetWorthRequirement: 2_000_000,
    liquidityRequirement: 400_000,
    entityRequirements: "Intercreditor agreement with senior lender required",
    prepaymentPenalty: "Make-whole",
    closingTimelineDays: 30,
    notes: "Fills the gap between senior debt and sponsor equity.",
    programs: [
      {
        programName: "Mezzanine Gap Financing",
        loanType: "MEZZANINE",
        purposes: ["PURCHASE", "REFINANCE"],
        minLoanAmount: 2_000_000,
        maxLoanAmount: 25_000_000,
        minDscr: 1.05,
        maxLtv: 85,
        maxLtc: 90,
        interestRateMin: 11,
        interestRateMax: 14,
        termMonths: 36,
        propertyTypes: ["OFFICE", "MIXED_USE", "MULTIFAMILY"],
        allowedStates: [...NORTHEAST, "IL", "TX"],
        isValueAdd: true,
        isCommercial: true,
      },
    ],
  },
  {
    companyName: "Patriot Land & Construction Lending",
    primaryContact: "Colonel Hank Bryant",
    email: "hank@patriotlandlending.com",
    phone: "615-555-0109",
    website: "https://patriotlandlending.com",
    loanTypes: ["CONSTRUCTION", "GROUND_UP"],
    propertyTypes: ["LAND", "MULTIFAMILY"],
    states: SOUTHEAST,
    minLoanAmount: 500_000,
    maxLoanAmount: 10_000_000,
    maxLtc: 70,
    maxLtv: 60,
    minDscr: 1.1,
    minCreditScore: 660,
    recourse: "RECOURSE",
    interestRateMin: 9,
    interestRateMax: 12,
    originationFeeMin: 1.5,
    originationFeeMax: 2.5,
    allowsConstruction: true,
    allowsGroundUp: true,
    allowsLand: true,
    preferredMarkets: ["Tennessee", "Georgia", "Carolinas"],
    requiredExperienceYears: 3,
    sponsorNetWorthRequirement: 500_000,
    liquidityRequirement: 100_000,
    entityRequirements: "Licensed GC required",
    prepaymentPenalty: "None",
    closingTimelineDays: 30,
    notes: "Land acquisition + ground-up construction for regional builders.",
    programs: [
      {
        programName: "Land Acquisition & Development",
        loanType: "CONSTRUCTION",
        purposes: ["CONSTRUCTION", "GROUND_UP"],
        minLoanAmount: 500_000,
        maxLoanAmount: 10_000_000,
        maxLtc: 65,
        maxLtv: 55,
        interestRateMin: 9.5,
        interestRateMax: 12,
        termMonths: 18,
        propertyTypes: ["LAND"],
        allowedStates: SOUTHEAST,
        isGroundUp: true,
        isConstruction: true,
        isCommercial: true,
      },
      {
        programName: "Ground-Up Multifamily (Regional)",
        loanType: "GROUND_UP",
        purposes: ["CONSTRUCTION", "GROUND_UP"],
        minLoanAmount: 1_000_000,
        maxLoanAmount: 10_000_000,
        maxLtc: 70,
        maxLtv: 60,
        interestRateMin: 9,
        interestRateMax: 11.5,
        termMonths: 24,
        propertyTypes: ["MULTIFAMILY"],
        allowedStates: SOUTHEAST,
        isGroundUp: true,
        isConstruction: true,
        isCommercial: true,
      },
    ],
  },
  {
    companyName: "Blue Ridge Community Lenders",
    primaryContact: "Ellen Marsh",
    email: "ellen@blueridgecl.com",
    phone: "828-555-0110",
    website: "https://blueridgecl.com",
    loanTypes: ["DSCR", "FIX_AND_FLIP"],
    propertyTypes: ["SINGLE_FAMILY", "MULTIFAMILY"],
    states: ["NC", "SC", "TN", "VA", "WV"],
    minLoanAmount: 75_000,
    maxLoanAmount: 1_500_000,
    maxLtc: 85,
    maxLtv: 75,
    minDscr: 1.0,
    minCreditScore: 640,
    recourse: "RECOURSE",
    interestRateMin: 8,
    interestRateMax: 11,
    originationFeeMin: 1.5,
    originationFeeMax: 2.5,
    allowsDscr: true,
    allowsFixFlip: true,
    preferredMarkets: ["Western NC", "Upstate SC"],
    requiredExperienceYears: 0,
    sponsorNetWorthRequirement: 75_000,
    liquidityRequirement: 20_000,
    entityRequirements: "None — individuals accepted",
    prepaymentPenalty: "None",
    closingTimelineDays: 18,
    notes: "Small-balance community lender, great for newer investors.",
    programs: [
      {
        programName: "Small Balance DSCR",
        loanType: "DSCR",
        purposes: ["PURCHASE", "REFINANCE", "DSCR"],
        minLoanAmount: 75_000,
        maxLoanAmount: 1_500_000,
        minDscr: 1.0,
        maxLtv: 75,
        maxLtc: 80,
        interestRateMin: 8,
        interestRateMax: 10,
        termMonths: 360,
        amortizationMonths: 360,
        propertyTypes: ["SINGLE_FAMILY", "MULTIFAMILY"],
        allowedStates: ["NC", "SC", "TN", "VA", "WV"],
        isPermanent: true,
        isResidential: true,
      },
      {
        programName: "Regional Fix & Flip",
        loanType: "FIX_AND_FLIP",
        purposes: ["PURCHASE", "FIX_AND_FLIP"],
        minLoanAmount: 75_000,
        maxLoanAmount: 750_000,
        maxLtv: 70,
        maxLtc: 85,
        interestRateMin: 9.5,
        interestRateMax: 11,
        termMonths: 12,
        interestOnly: true,
        propertyTypes: ["SINGLE_FAMILY"],
        allowedStates: ["NC", "SC", "TN", "VA", "WV"],
        isFixFlip: true,
        isResidential: true,
      },
    ],
  },
];

interface BorrowerSeed {
  borrowerName: string;
  email: string;
  phone: string;
  businessName: string;
  entityType: string;
  experienceYears: number;
  creditScore: number;
  liquidity: number;
  netWorth: number;
  request: {
    requestedLoanAmount: number;
    purchasePrice: number;
    propertyValue: number;
    ltv: number;
    ltc: number;
    dscr: number;
    noi: number;
    capRate: number;
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    propertyZip: string;
    propertyType: PropertyType;
    loanPurpose: LoanPurpose;
    timelineDays: number;
    exitStrategy: string;
    notes: string;
  };
}

const BORROWERS: BorrowerSeed[] = [
  {
    borrowerName: "Michael Torres",
    email: "michael.torres@example.com",
    phone: "201-555-0201",
    businessName: "Torres Realty Holdings LLC",
    entityType: "LLC",
    experienceYears: 6,
    creditScore: 740,
    liquidity: 300_000,
    netWorth: 1_800_000,
    request: {
      requestedLoanAmount: 3_200_000,
      purchasePrice: 4_000_000,
      propertyValue: 4_200_000,
      ltv: 76,
      ltc: 80,
      dscr: 1.28,
      noi: 336_000,
      capRate: 6.2,
      propertyAddress: "412 Bergen Ave",
      propertyCity: "Jersey City",
      propertyState: "NJ",
      propertyZip: "07304",
      propertyType: "MULTIFAMILY",
      loanPurpose: "BRIDGE",
      timelineDays: 30,
      exitStrategy: "Refinance to permanent DSCR loan after stabilization",
      notes: "24-unit value-add multifamily, light renovation planned.",
    },
  },
  {
    borrowerName: "Ashley Kim",
    email: "ashley.kim@example.com",
    phone: "704-555-0202",
    businessName: "Kim Investment Group",
    entityType: "LLC",
    experienceYears: 1,
    creditScore: 700,
    liquidity: 60_000,
    netWorth: 220_000,
    request: {
      requestedLoanAmount: 240_000,
      purchasePrice: 300_000,
      propertyValue: 310_000,
      ltv: 77,
      ltc: 82,
      dscr: 1.05,
      noi: 21_000,
      capRate: 6.8,
      propertyAddress: "88 Maple St",
      propertyCity: "Charlotte",
      propertyState: "NC",
      propertyZip: "28202",
      propertyType: "SINGLE_FAMILY",
      loanPurpose: "DSCR",
      timelineDays: 21,
      exitStrategy: "Hold as long-term rental",
      notes: "First rental property purchase.",
    },
  },
  {
    borrowerName: "David Whitfield",
    email: "david.whitfield@example.com",
    phone: "813-555-0203",
    businessName: "Whitfield Hospitality Partners",
    entityType: "LP",
    experienceYears: 9,
    creditScore: 720,
    liquidity: 450_000,
    netWorth: 3_200_000,
    request: {
      requestedLoanAmount: 8_500_000,
      purchasePrice: 11_000_000,
      propertyValue: 11_500_000,
      ltv: 74,
      ltc: 77,
      dscr: 1.3,
      noi: 1_150_000,
      capRate: 9.5,
      propertyAddress: "2200 Gulf Shore Blvd",
      propertyCity: "Clearwater",
      propertyState: "FL",
      propertyZip: "33755",
      propertyType: "HOSPITALITY",
      loanPurpose: "BRIDGE",
      timelineDays: 40,
      exitStrategy: "Sell after brand conversion and 24mo stabilization",
      notes: "60-key beachfront hotel, planning brand conversion.",
    },
  },
  {
    borrowerName: "Priya Nair",
    email: "priya.nair@example.com",
    phone: "480-555-0204",
    businessName: "Nair Development Co",
    entityType: "LLC",
    experienceYears: 12,
    creditScore: 760,
    liquidity: 1_200_000,
    netWorth: 8_000_000,
    request: {
      requestedLoanAmount: 18_000_000,
      purchasePrice: 5_500_000,
      propertyValue: 27_000_000,
      ltv: 60,
      ltc: 68,
      dscr: 1.4,
      noi: 0,
      capRate: 0,
      propertyAddress: "7550 Camelback Commons",
      propertyCity: "Scottsdale",
      propertyState: "AZ",
      propertyZip: "85251",
      propertyType: "MULTIFAMILY",
      loanPurpose: "GROUND_UP",
      timelineDays: 60,
      exitStrategy: "Refinance to agency permanent debt post-lease-up",
      notes: "220-unit ground-up multifamily development, land already owned.",
    },
  },
  {
    borrowerName: "Robert Jenkins",
    email: "robert.jenkins@example.com",
    phone: "312-555-0205",
    businessName: "Jenkins Office Partners",
    entityType: "LLC",
    experienceYears: 15,
    creditScore: 715,
    liquidity: 900_000,
    netWorth: 6_500_000,
    request: {
      requestedLoanAmount: 9_000_000,
      purchasePrice: 12_000_000,
      propertyValue: 12_500_000,
      ltv: 72,
      ltc: 75,
      dscr: 1.1,
      noi: 990_000,
      capRate: 7.9,
      propertyAddress: "500 W Adams St",
      propertyCity: "Chicago",
      propertyState: "IL",
      propertyZip: "60661",
      propertyType: "OFFICE",
      loanPurpose: "REFINANCE",
      timelineDays: 45,
      exitStrategy: "Long-term hold, refinance in 5 years",
      notes: "Class B office building, 82% leased, seeking mezz to fill gap.",
    },
  },
  {
    borrowerName: "Sara Delgado",
    email: "sara.delgado@example.com",
    phone: "614-555-0206",
    businessName: "Delgado Storage Ventures",
    entityType: "LLC",
    experienceYears: 4,
    creditScore: 705,
    liquidity: 220_000,
    netWorth: 1_100_000,
    request: {
      requestedLoanAmount: 4_200_000,
      purchasePrice: 5_500_000,
      propertyValue: 5_700_000,
      ltv: 73,
      ltc: 76,
      dscr: 1.32,
      noi: 462_000,
      capRate: 8.1,
      propertyAddress: "1900 Westerville Rd",
      propertyCity: "Columbus",
      propertyState: "OH",
      propertyZip: "43224",
      propertyType: "SELF_STORAGE",
      loanPurpose: "PURCHASE",
      timelineDays: 35,
      exitStrategy: "Hold and refinance to permanent in 3 years",
      notes: "Stabilized self-storage facility, 92% occupied.",
    },
  },
  {
    borrowerName: "James Okafor",
    email: "james.okafor@example.com",
    phone: "678-555-0207",
    businessName: "Okafor Flip Partners",
    entityType: "LLC",
    experienceYears: 3,
    creditScore: 690,
    liquidity: 90_000,
    netWorth: 450_000,
    request: {
      requestedLoanAmount: 380_000,
      purchasePrice: 340_000,
      propertyValue: 520_000,
      ltv: 65,
      ltc: 88,
      dscr: 0,
      noi: 0,
      capRate: 0,
      propertyAddress: "115 Peachtree Walk",
      propertyCity: "Atlanta",
      propertyState: "GA",
      propertyZip: "30308",
      propertyType: "SINGLE_FAMILY",
      loanPurpose: "FIX_AND_FLIP",
      timelineDays: 14,
      exitStrategy: "Renovate and sell within 6 months",
      notes: "Full gut renovation, comps support ARV of $520k.",
    },
  },
  {
    borrowerName: "Linda Park",
    email: "linda.park@example.com",
    phone: "917-555-0208",
    businessName: "Park Mixed-Use Holdings",
    entityType: "LLC",
    experienceYears: 7,
    creditScore: 735,
    liquidity: 380_000,
    netWorth: 2_400_000,
    request: {
      requestedLoanAmount: 2_600_000,
      purchasePrice: 3_300_000,
      propertyValue: 3_450_000,
      ltv: 75,
      ltc: 79,
      dscr: 1.22,
      noi: 264_000,
      capRate: 7.1,
      propertyAddress: "88 Grove St",
      propertyCity: "Jersey City",
      propertyState: "NJ",
      propertyZip: "07302",
      propertyType: "MIXED_USE",
      loanPurpose: "PURCHASE",
      timelineDays: 30,
      exitStrategy: "Refinance to permanent after lease-up of retail space",
      notes: "Ground-floor retail with 8 residential units above.",
    },
  },
];

async function main() {
  console.log("Seeding database…");

  const org = await prisma.organization.upsert({
    where: { slug: ORG_SLUG },
    update: {},
    create: { name: "Xtrava Capital", slug: ORG_SLUG },
  });

  const admin = await prisma.user.upsert({
    where: { clerkId: "seed_admin_user" },
    update: {},
    create: {
      clerkId: "seed_admin_user",
      email: "admin@xtravacapital.com",
      firstName: "Alex",
      lastName: "Rivera",
      role: "ADMIN",
      organizationId: org.id,
    },
  });

  console.log(`Organization: ${org.name}`);
  console.log(`Admin user: ${admin.email} (seed clerkId=${admin.clerkId} — see README to link a real Clerk account)`);

  let lenderCount = 0;
  let programCount = 0;

  for (const seedLender of LENDERS) {
    const { programs, ...lenderData } = seedLender;
    const lender = await prisma.lender.upsert({
      where: { id: `seed-${slugify(lenderData.companyName)}` },
      update: {},
      create: {
        id: `seed-${slugify(lenderData.companyName)}`,
        organizationId: org.id,
        ...lenderData,
      },
    });
    lenderCount++;

    for (const program of programs) {
      await prisma.loanProgram.upsert({
        where: { id: `seed-${slugify(lenderData.companyName)}-${slugify(program.programName)}` },
        update: {},
        create: {
          id: `seed-${slugify(lenderData.companyName)}-${slugify(program.programName)}`,
          lenderId: lender.id,
          ...program,
        },
      });
      programCount++;
    }

    await prisma.activityLog.create({
      data: {
        organizationId: org.id,
        actorId: admin.id,
        action: "lender.created",
        entityType: "Lender",
        entityId: lender.id,
        metadata: { companyName: lender.companyName },
      },
    });
  }

  console.log(`Lenders: ${lenderCount}, Loan programs: ${programCount}`);

  // Link the first lender to a demo LENDER-role user so the app has a
  // realistic "logged in as a lender" experience out of the box.
  const demoLender = await prisma.lender.findUnique({ where: { id: `seed-${slugify(LENDERS[0].companyName)}` } });
  if (demoLender) {
    await prisma.user.upsert({
      where: { clerkId: "seed_lender_user" },
      update: {},
      create: {
        clerkId: "seed_lender_user",
        email: demoLender.email,
        firstName: demoLender.primaryContact.split(" ")[0],
        lastName: demoLender.primaryContact.split(" ").slice(1).join(" "),
        role: "LENDER",
        organizationId: org.id,
        lenderId: demoLender.id,
      },
    });
  }

  let borrowerCount = 0;
  let requestCount = 0;

  for (const [index, seedBorrower] of BORROWERS.entries()) {
    const { request, ...borrowerData } = seedBorrower;
    const borrower = await prisma.borrower.upsert({
      where: { organizationId_email: { organizationId: org.id, email: borrowerData.email } },
      update: {},
      create: { organizationId: org.id, ...borrowerData },
    });
    borrowerCount++;

    if (index === 0) {
      await prisma.user.upsert({
        where: { clerkId: "seed_borrower_user" },
        update: {},
        create: {
          clerkId: "seed_borrower_user",
          email: borrower.email,
          firstName: borrower.borrowerName.split(" ")[0],
          lastName: borrower.borrowerName.split(" ").slice(1).join(" "),
          role: "BORROWER",
          organizationId: org.id,
          borrowerId: borrower.id,
        },
      });
    }

    const loanRequest = await prisma.loanRequest.upsert({
      where: { id: `seed-request-${index}` },
      update: {},
      create: { id: `seed-request-${index}`, borrowerId: borrower.id, ...request },
    });
    requestCount++;

    await prisma.activityLog.create({
      data: {
        organizationId: org.id,
        actorId: admin.id,
        action: "loan_request.submitted",
        entityType: "LoanRequest",
        entityId: loanRequest.id,
        metadata: { borrowerName: borrower.borrowerName },
      },
    });

    await prisma.comment.create({
      data: {
        loanRequestId: loanRequest.id,
        authorId: admin.id,
        body: "Reviewed the submission — running it through the matching engine now.",
      },
    });

    console.log(`Running matching engine for ${borrower.borrowerName}'s request…`);
    await runMatchingForLoanRequest(loanRequest.id);
  }

  console.log(`Borrowers: ${borrowerCount}, Loan requests: ${requestCount}`);
  console.log("Seed complete.");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
