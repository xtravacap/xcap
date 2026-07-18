import { z } from "zod";
import { zLoanPurpose, zOccupancyType, zPropertyType, zRecourseType, zUsStateCode } from "./common";

export const borrowerContactSchema = z.object({
  borrowerName: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email(),
  phone: z.string().trim().optional().nullable(),
  businessName: z.string().trim().optional().nullable(),
  entityType: z.string().trim().optional().nullable(),
  experienceYears: z.coerce.number().int().min(0).optional().nullable(),
  creditScore: z.coerce.number().int().min(300).max(850).optional().nullable(),
  liquidity: z.coerce.number().min(0).optional().nullable(),
  netWorth: z.coerce.number().min(0).optional().nullable(),
});

export const loanRequestDetailsSchema = z.object({
  requestedLoanAmount: z.coerce.number().positive("Requested loan amount is required"),
  purchasePrice: z.coerce.number().min(0).optional().nullable(),
  propertyValue: z.coerce.number().min(0).optional().nullable(),
  ltv: z.coerce.number().min(0).max(100).optional().nullable(),
  ltc: z.coerce.number().min(0).max(100).optional().nullable(),
  dscr: z.coerce.number().min(0).optional().nullable(),
  noi: z.coerce.number().optional().nullable(),
  capRate: z.coerce.number().min(0).max(100).optional().nullable(),

  propertyAddress: z.string().trim().min(1, "Property address is required"),
  propertyCity: z.string().trim().optional().nullable(),
  propertyState: zUsStateCode,
  propertyZip: z.string().trim().optional().nullable(),
  propertyType: zPropertyType,
  occupancy: zOccupancyType.optional().nullable(),

  loanPurpose: zLoanPurpose,
  recoursePreference: zRecourseType.optional().nullable(),
  timelineDays: z.coerce.number().int().min(0).optional().nullable(),
  closingDate: z.coerce.date().optional().nullable(),
  exitStrategy: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const loanRequestSubmissionSchema = z.object({
  borrower: borrowerContactSchema,
  loanRequest: loanRequestDetailsSchema,
});

export const loanRequestStatusUpdateSchema = z.object({
  status: z.enum([
    "SUBMITTED",
    "UNDER_REVIEW",
    "MATCHED",
    "INTRODUCED",
    "IN_UNDERWRITING",
    "CLOSED_WON",
    "CLOSED_LOST",
    "WITHDRAWN",
  ]),
});

export type LoanRequestSubmissionInput = z.infer<typeof loanRequestSubmissionSchema>;
