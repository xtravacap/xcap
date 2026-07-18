import { z } from "zod";
import { zLoanType, zPropertyType, zRecourseType, zUsStateCode } from "./common";

export const lenderSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  primaryContact: z.string().trim().min(1, "Primary contact is required"),
  email: z.string().trim().email(),
  phone: z.string().trim().optional().nullable(),
  website: z.string().trim().url().optional().or(z.literal("")).nullable(),
  logoUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),

  loanTypes: z.array(zLoanType).default([]),
  propertyTypes: z.array(zPropertyType).default([]),
  states: z.array(zUsStateCode).default([]),

  minLoanAmount: z.coerce.number().min(0),
  maxLoanAmount: z.coerce.number().min(0),
  maxLtc: z.coerce.number().min(0).max(100).optional().nullable(),
  maxLtv: z.coerce.number().min(0).max(100).optional().nullable(),
  minDscr: z.coerce.number().min(0).optional().nullable(),
  minCreditScore: z.coerce.number().int().min(300).max(850).optional().nullable(),
  recourse: zRecourseType.default("EITHER"),
  interestRateMin: z.coerce.number().min(0).max(100).optional().nullable(),
  interestRateMax: z.coerce.number().min(0).max(100).optional().nullable(),
  originationFeeMin: z.coerce.number().min(0).max(100).optional().nullable(),
  originationFeeMax: z.coerce.number().min(0).max(100).optional().nullable(),

  allowsBridge: z.boolean().default(false),
  allowsDscr: z.boolean().default(false),
  allowsConstruction: z.boolean().default(false),
  allowsGroundUp: z.boolean().default(false),
  allowsFixFlip: z.boolean().default(false),
  allowsMultifamily: z.boolean().default(false),
  allowsMixedUse: z.boolean().default(false),
  allowsRetail: z.boolean().default(false),
  allowsOffice: z.boolean().default(false),
  allowsIndustrial: z.boolean().default(false),
  allowsSelfStorage: z.boolean().default(false),
  allowsHospitality: z.boolean().default(false),
  allowsLand: z.boolean().default(false),

  preferredMarkets: z.array(z.string().trim()).default([]),
  requiredExperienceYears: z.coerce.number().int().min(0).optional().nullable(),
  sponsorNetWorthRequirement: z.coerce.number().min(0).optional().nullable(),
  liquidityRequirement: z.coerce.number().min(0).optional().nullable(),
  entityRequirements: z.string().trim().optional().nullable(),
  prepaymentPenalty: z.string().trim().optional().nullable(),
  closingTimelineDays: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const lenderUpdateSchema = lenderSchema.partial();

export type LenderInput = z.infer<typeof lenderSchema>;
