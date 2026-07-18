import "server-only";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

import { AI_EXTRACTION_MODEL, getOpenAIClient } from "./openai";
import { extractPlainText } from "./extract-text";

export const loanDocumentExtractionSchema = z.object({
  purchasePrice: z.number().nullable(),
  propertyAddress: z.string().nullable(),
  propertyCity: z.string().nullable(),
  propertyState: z.string().nullable(),
  propertyType: z.string().nullable(),
  noi: z.number().nullable(),
  dscr: z.number().nullable(),
  ltv: z.number().nullable(),
  capRate: z.number().nullable(),
  loanAmount: z.number().nullable(),
  rentRollSummary: z.string().nullable(),
  sponsorName: z.string().nullable(),
  sponsorExperienceYears: z.number().nullable(),
  notes: z.string().nullable(),
});

export type LoanDocumentExtraction = z.infer<typeof loanDocumentExtractionSchema>;

const EXTRACTION_PROMPT =
  "You are reviewing a commercial real estate loan document (purchase contract, rent roll, appraisal, " +
  "financials, or operating statement). Extract the fields in the schema as accurately as possible. " +
  "Use null for anything not present or not determinable. All monetary and ratio fields must be plain " +
  "numbers (no currency symbols, commas, or percent signs). DSCR and cap rate are ratios/percentages as " +
  "numbers (e.g. 1.25 for a 1.25x DSCR, 6.5 for a 6.5% cap rate).";

/**
 * Extracts structured loan/property data from an uploaded borrower document
 * using OpenAI. PDFs and images are sent directly (vision + document input);
 * Word/Excel/CSV are converted to text first.
 */
export async function extractLoanDocument(input: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}): Promise<LoanDocumentExtraction> {
  const client = getOpenAIClient();
  const isPdf = input.mimeType === "application/pdf";
  const isImage = input.mimeType.startsWith("image/");

  const content: Array<
    | { type: "input_text"; text: string }
    | { type: "input_file"; filename: string; file_data: string }
    | { type: "input_image"; image_url: string; detail: "auto" }
  > = [{ type: "input_text", text: EXTRACTION_PROMPT }];

  if (isPdf) {
    content.push({
      type: "input_file",
      filename: input.fileName,
      file_data: `data:application/pdf;base64,${input.buffer.toString("base64")}`,
    });
  } else if (isImage) {
    content.push({
      type: "input_image",
      image_url: `data:${input.mimeType};base64,${input.buffer.toString("base64")}`,
      detail: "auto",
    });
  } else {
    const text = await extractPlainText(input.buffer, input.mimeType, input.fileName);
    content.push({ type: "input_text", text: text.slice(0, 60_000) });
  }

  const response = await client.responses.parse({
    model: AI_EXTRACTION_MODEL,
    input: [{ role: "user", content }],
    text: { format: zodTextFormat(loanDocumentExtractionSchema, "loan_document_extraction") },
  });

  const parsed = response.output_parsed;
  if (!parsed) throw new Error("OpenAI did not return a parsed extraction");
  return parsed;
}
