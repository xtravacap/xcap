import { z } from "zod";

export const commentSchema = z.object({
  loanRequestId: z.string().min(1),
  body: z.string().trim().min(1, "Comment can't be empty"),
});

export const matchOverrideSchema = z.object({
  status: z.enum(["SUGGESTED", "APPROVED", "REJECTED", "INTRODUCED", "RESPONDED", "DECLINED_BY_LENDER", "FUNDED"]),
  overrideNote: z.string().trim().optional().nullable(),
});
