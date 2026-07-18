import { z } from "zod";
import { zLoanPurpose, zLoanType, zPropertyType, zUsStateCode } from "./common";

export const loanProgramSchema = z.object({
  lenderId: z.string().min(1),
  programName: z.string().trim().min(1, "Program name is required"),
  loanType: zLoanType,
  purposes: z.array(zLoanPurpose).default([]),

  minLoanAmount: z.coerce.number().min(0),
  maxLoanAmount: z.coerce.number().min(0),
  minDscr: z.coerce.number().min(0).optional().nullable(),
  maxLtv: z.coerce.number().min(0).max(100).optional().nullable(),
  maxLtc: z.coerce.number().min(0).max(100).optional().nullable(),
  interestRateMin: z.coerce.number().min(0).max(100).optional().nullable(),
  interestRateMax: z.coerce.number().min(0).max(100).optional().nullable(),
  termMonths: z.coerce.number().int().min(0).optional().nullable(),
  amortizationMonths: z.coerce.number().int().min(0).optional().nullable(),
  prepayment: z.string().trim().optional().nullable(),
  interestOnly: z.boolean().default(false),

  propertyTypes: z.array(zPropertyType).default([]),
  allowedStates: z.array(zUsStateCode).default([]),

  isBridge: z.boolean().default(false),
  isPermanent: z.boolean().default(false),
  isConstruction: z.boolean().default(false),
  isValueAdd: z.boolean().default(false),
  isGroundUp: z.boolean().default(false),
  isFixFlip: z.boolean().default(false),
  isRentalPortfolio: z.boolean().default(false),
  isCommercial: z.boolean().default(false),
  isResidential: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const loanProgramUpdateSchema = loanProgramSchema.partial().omit({ lenderId: true });

export type LoanProgramInput = z.infer<typeof loanProgramSchema>;
