import type { Prisma } from "@prisma/client";
import { LOAN_TYPE_KEYWORDS, PROPERTY_TYPE_KEYWORDS, mapKeywordOptional } from "@/lib/ai/enum-mapping";

const STATE_NAMES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO",
  connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH",
  oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT", virginia: "VA",
  washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};

const VALID_STATE_CODES = new Set(Object.values(STATE_NAMES));

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[$,]/g, "").trim().toLowerCase();
  const multiplier = /(million|mil|m)$/.test(cleaned) ? 1_000_000 : /(thousand|k)$/.test(cleaned) ? 1_000 : 1;
  const numeric = parseFloat(cleaned.replace(/(million|mil|thousand|[mk])$/, ""));
  return numeric * multiplier;
}

export interface ParsedLenderSearch {
  where: Prisma.LenderWhereInput;
  interpretation: string[];
}

/** Best-effort structured parser for queries like "Bridge lenders in NJ" or
 * "DSCR lenders over $2M". Falls back gracefully — unmatched text becomes a
 * plain contains() search elsewhere in the caller. */
export function parseLenderSearchQuery(query: string): ParsedLenderSearch {
  const where: Prisma.LenderWhereInput = {};
  const interpretation: string[] = [];
  const lower = query.toLowerCase();

  const loanType = mapKeywordOptional(query, LOAN_TYPE_KEYWORDS);
  if (loanType) {
    where.loanTypes = { has: loanType };
    interpretation.push(`loan type = ${loanType}`);
  }

  const propertyType = mapKeywordOptional(query, PROPERTY_TYPE_KEYWORDS);
  if (propertyType) {
    where.propertyTypes = { has: propertyType };
    interpretation.push(`property type = ${propertyType}`);
  }

  const stateCodeMatch = lower.match(/\bin\s+([a-z]{2})\b/i) ?? lower.match(/\b([a-z]{2})\b\s+lenders/i);
  const stateNameMatch = Object.keys(STATE_NAMES).find((name) => lower.includes(name));
  const stateCode = stateCodeMatch?.[1]?.toUpperCase();
  if (stateCode && VALID_STATE_CODES.has(stateCode)) {
    where.states = { has: stateCode };
    interpretation.push(`state = ${stateCode}`);
  } else if (stateNameMatch) {
    where.states = { has: STATE_NAMES[stateNameMatch] };
    interpretation.push(`state = ${STATE_NAMES[stateNameMatch]}`);
  }

  const amountMatch = lower.match(/(over|above|greater than|more than)\s+\$?([\d,.]+\s?(?:million|mil|m|thousand|k)?)/);
  if (amountMatch) {
    const amount = parseAmount(amountMatch[2]);
    where.maxLoanAmount = { gte: amount };
    interpretation.push(`max loan amount ≥ ${amount.toLocaleString()}`);
  }
  const underMatch = lower.match(/(under|below|less than)\s+\$?([\d,.]+\s?(?:million|mil|m|thousand|k)?)/);
  if (underMatch) {
    const amount = parseAmount(underMatch[2]);
    where.minLoanAmount = { lte: amount };
    interpretation.push(`min loan amount ≤ ${amount.toLocaleString()}`);
  }

  const ltvMatch = lower.match(/ltv\s+(over|above|greater than)\s+(\d+)%?/);
  if (ltvMatch) {
    where.maxLtv = { gte: Number(ltvMatch[2]) };
    interpretation.push(`max LTV ≥ ${ltvMatch[2]}%`);
  }

  const dscrMatch = lower.match(/dscr\s+(under|below|less than)\s+([\d.]+)/);
  if (dscrMatch) {
    where.minDscr = { lte: Number(dscrMatch[2]) };
    interpretation.push(`min DSCR ≤ ${dscrMatch[2]}`);
  }

  return { where, interpretation };
}
