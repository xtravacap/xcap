import "server-only";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

import { AI_EXTRACTION_MODEL, getOpenAIClient } from "./openai";
import { extractPlainText } from "./extract-text";
import { LOAN_PURPOSE_KEYWORDS, LOAN_TYPE_KEYWORDS, PROPERTY_TYPE_KEYWORDS, mapKeyword, mapKeywordList, normalizeState } from "./enum-mapping";
import { prisma } from "@/lib/prisma";

const extractedProgramSchema = z.object({
  programName: z.string(),
  loanType: z.string().describe("Free-text loan type, e.g. 'Bridge', 'DSCR Rental', 'Ground-up Construction'"),
  purposes: z.array(z.string()).default([]),
  minLoanAmount: z.number().nullable(),
  maxLoanAmount: z.number().nullable(),
  minDscr: z.number().nullable(),
  maxLtv: z.number().nullable(),
  maxLtc: z.number().nullable(),
  interestRateMin: z.number().nullable(),
  interestRateMax: z.number().nullable(),
  termMonths: z.number().nullable(),
  propertyTypes: z.array(z.string()).default([]),
  allowedStates: z.array(z.string()).default([]),
  notes: z.string().nullable(),
});

const lenderGuidelineExtractionSchema = z.object({
  programs: z.array(extractedProgramSchema),
});

export type ExtractedLoanProgram = z.infer<typeof extractedProgramSchema>;

const GUIDELINE_PROMPT =
  "You are reading a lender's loan matrix / rate sheet / guideline document. Identify every distinct loan " +
  "program it offers and extract its parameters. A single document may describe multiple programs (e.g. " +
  "'Bridge', 'DSCR 30yr', 'Ground-Up Construction') — return one entry per program. Loan amounts are plain " +
  "numbers in dollars. LTV/LTC/rates are plain numbers as percentages (e.g. 75 for 75%). DSCR is a plain " +
  "decimal (e.g. 1.2). States should be two-letter USPS codes. Use null/empty arrays for anything not present.";

/** Runs OpenAI extraction over a lender guideline document (PDF/Excel/Word/CSV). */
export async function extractLenderGuidelines(input: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}): Promise<ExtractedLoanProgram[]> {
  const client = getOpenAIClient();
  const isPdf = input.mimeType === "application/pdf";

  const content: Array<
    | { type: "input_text"; text: string }
    | { type: "input_file"; filename: string; file_data: string }
  > = [{ type: "input_text", text: GUIDELINE_PROMPT }];

  if (isPdf) {
    content.push({
      type: "input_file",
      filename: input.fileName,
      file_data: `data:application/pdf;base64,${input.buffer.toString("base64")}`,
    });
  } else {
    const text = await extractPlainText(input.buffer, input.mimeType, input.fileName);
    content.push({ type: "input_text", text: text.slice(0, 80_000) });
  }

  const response = await client.responses.parse({
    model: AI_EXTRACTION_MODEL,
    input: [{ role: "user", content }],
    text: { format: zodTextFormat(lenderGuidelineExtractionSchema, "lender_guideline_extraction") },
  });

  const parsed = response.output_parsed;
  if (!parsed) throw new Error("OpenAI did not return a parsed extraction");
  return parsed.programs;
}

/**
 * Extracts programs from a lender guideline upload and upserts them as
 * `LoanProgram` rows for the given lender (matched by program name).
 */
export async function parseLenderGuidelinesAndUpsertPrograms(lenderId: string, buffer: Buffer, mimeType: string, fileName: string) {
  const extracted = await extractLenderGuidelines({ buffer, mimeType, fileName });

  const created: string[] = [];
  for (const program of extracted) {
    const loanType = mapKeyword(program.loanType, LOAN_TYPE_KEYWORDS, "BRIDGE");
    const propertyTypes = mapKeywordList(program.propertyTypes, PROPERTY_TYPE_KEYWORDS);
    const purposes = mapKeywordList(
      program.purposes.length > 0 ? program.purposes : [program.loanType],
      LOAN_PURPOSE_KEYWORDS,
    );
    const allowedStates = program.allowedStates.map(normalizeState).filter((s): s is string => !!s);

    const existing = await prisma.loanProgram.findFirst({
      where: { lenderId, programName: program.programName },
    });

    const data = {
      lenderId,
      programName: program.programName,
      loanType,
      purposes,
      minLoanAmount: program.minLoanAmount ?? 0,
      maxLoanAmount: program.maxLoanAmount ?? 0,
      minDscr: program.minDscr,
      maxLtv: program.maxLtv,
      maxLtc: program.maxLtc,
      interestRateMin: program.interestRateMin,
      interestRateMax: program.interestRateMax,
      termMonths: program.termMonths,
      propertyTypes,
      allowedStates,
      isBridge: loanType === "BRIDGE",
      isConstruction: loanType === "CONSTRUCTION",
      isGroundUp: loanType === "GROUND_UP",
      isFixFlip: loanType === "FIX_AND_FLIP",
      isPermanent: loanType === "PERMANENT",
      isRentalPortfolio: loanType === "RENTAL_PORTFOLIO",
      isCommercial: !propertyTypes.includes("SINGLE_FAMILY"),
      isResidential: propertyTypes.includes("SINGLE_FAMILY"),
    };

    if (existing) {
      await prisma.loanProgram.update({ where: { id: existing.id }, data });
    } else {
      await prisma.loanProgram.create({ data });
    }
    created.push(program.programName);
  }

  return created;
}
