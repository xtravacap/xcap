import { LoanPurpose, LoanType, PropertyType } from "@prisma/client";

export const LOAN_TYPE_KEYWORDS: Array<[LoanType, RegExp]> = [
  ["BRIDGE", /bridge/i],
  ["DSCR", /dscr/i],
  ["CONSTRUCTION", /construction/i],
  ["GROUND_UP", /ground.?up/i],
  ["FIX_AND_FLIP", /fix.?(and|&|\s)?.?flip/i],
  ["MEZZANINE", /mezz/i],
  ["VALUE_ADD", /value.?add/i],
  ["RENTAL_PORTFOLIO", /rental portfolio|portfolio loan/i],
  ["MIXED_USE_FINANCING", /mixed.?use/i],
  ["PERMANENT", /permanent|perm\b|30.?year|takeout/i],
];

export const PROPERTY_TYPE_KEYWORDS: Array<[PropertyType, RegExp]> = [
  ["MULTIFAMILY", /multi.?family|apartment/i],
  ["MIXED_USE", /mixed.?use/i],
  ["RETAIL", /retail/i],
  ["OFFICE", /office/i],
  ["INDUSTRIAL", /industrial|warehouse/i],
  ["SELF_STORAGE", /self.?storage/i],
  ["HOSPITALITY", /hospitality|hotel|motel/i],
  ["LAND", /\bland\b/i],
  ["SINGLE_FAMILY", /single.?family|sfr\b/i],
  ["WAREHOUSE", /warehouse/i],
  ["MEDICAL", /medical|healthcare/i],
];

export const LOAN_PURPOSE_KEYWORDS: Array<[LoanPurpose, RegExp]> = [
  ["PURCHASE", /purchase|acquisition/i],
  ["REFINANCE", /refinance|refi\b/i],
  ["CASH_OUT", /cash.?out/i],
  ["CONSTRUCTION", /construction/i],
  ["BRIDGE", /bridge/i],
  ["DSCR", /dscr/i],
  ["FIX_AND_FLIP", /fix.?(and|&|\s)?.?flip/i],
  ["GROUND_UP", /ground.?up/i],
];

export function mapKeyword<T extends string>(text: string, table: Array<[T, RegExp]>, fallback: T): T {
  for (const [value, pattern] of table) {
    if (pattern.test(text)) return value;
  }
  return fallback;
}

export function mapKeywordOptional<T extends string>(text: string, table: Array<[T, RegExp]>): T | null {
  for (const [value, pattern] of table) {
    if (pattern.test(text)) return value;
  }
  return null;
}

export function mapKeywordList<T extends string>(values: string[], table: Array<[T, RegExp]>): T[] {
  const results = new Set<T>();
  for (const value of values) {
    for (const [mapped, pattern] of table) {
      if (pattern.test(value)) results.add(mapped);
    }
  }
  return Array.from(results);
}

export function normalizeState(state: string): string | null {
  const trimmed = state.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(trimmed) ? trimmed : null;
}
