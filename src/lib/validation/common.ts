import { z } from "zod";
import {
  DocumentType,
  LoanPurpose,
  LoanType,
  MatchStatus,
  OccupancyType,
  PropertyType,
  RecourseType,
  RequestStatus,
} from "@prisma/client";

export const zLoanType = z.nativeEnum(LoanType);
export const zPropertyType = z.nativeEnum(PropertyType);
export const zRecourseType = z.nativeEnum(RecourseType);
export const zLoanPurpose = z.nativeEnum(LoanPurpose);
export const zOccupancyType = z.nativeEnum(OccupancyType);
export const zRequestStatus = z.nativeEnum(RequestStatus);
export const zMatchStatus = z.nativeEnum(MatchStatus);
export const zDocumentType = z.nativeEnum(DocumentType);

export const zUsStateCode = z.string().trim().length(2).toUpperCase();

export const zPagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
