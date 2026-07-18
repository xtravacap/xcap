import { z } from "zod";
import { zDocumentType } from "./common";

export const documentCreateSchema = z.object({
  loanRequestId: z.string().min(1).optional().nullable(),
  lenderId: z.string().min(1).optional().nullable(),
  documentType: zDocumentType,
  fileName: z.string().trim().min(1),
  storagePath: z.string().trim().min(1),
  fileSize: z.coerce.number().int().min(0).optional().nullable(),
  mimeType: z.string().trim().optional().nullable(),
});
