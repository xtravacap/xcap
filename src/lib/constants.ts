import type { LoanPurpose, LoanType, PropertyType, RecourseType } from "@prisma/client";

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA",
  "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

export const LOAN_TYPE_OPTIONS: { value: LoanType; label: string }[] = [
  { value: "BRIDGE", label: "Bridge" },
  { value: "DSCR", label: "DSCR" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "GROUND_UP", label: "Ground Up" },
  { value: "FIX_AND_FLIP", label: "Fix & Flip" },
  { value: "PERMANENT", label: "Permanent" },
  { value: "MEZZANINE", label: "Mezzanine" },
  { value: "VALUE_ADD", label: "Value-Add" },
  { value: "RENTAL_PORTFOLIO", label: "Rental Portfolio" },
  { value: "MIXED_USE_FINANCING", label: "Mixed-Use Financing" },
];

export const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: "MULTIFAMILY", label: "Multifamily" },
  { value: "MIXED_USE", label: "Mixed Use" },
  { value: "RETAIL", label: "Retail" },
  { value: "OFFICE", label: "Office" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "SELF_STORAGE", label: "Self Storage" },
  { value: "HOSPITALITY", label: "Hospitality" },
  { value: "LAND", label: "Land" },
  { value: "SINGLE_FAMILY", label: "Single Family" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "MEDICAL", label: "Medical" },
  { value: "OTHER", label: "Other" },
];

export const LOAN_PURPOSE_OPTIONS: { value: LoanPurpose; label: string }[] = [
  { value: "PURCHASE", label: "Purchase" },
  { value: "REFINANCE", label: "Refinance" },
  { value: "CASH_OUT", label: "Cash Out" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "BRIDGE", label: "Bridge" },
  { value: "DSCR", label: "DSCR" },
  { value: "FIX_AND_FLIP", label: "Fix & Flip" },
  { value: "GROUND_UP", label: "Ground Up" },
];

export const RECOURSE_OPTIONS: { value: RecourseType; label: string }[] = [
  { value: "RECOURSE", label: "Recourse" },
  { value: "NON_RECOURSE", label: "Non-Recourse" },
  { value: "EITHER", label: "Either" },
];

export const OCCUPANCY_OPTIONS = [
  { value: "OWNER_OCCUPIED", label: "Owner Occupied" },
  { value: "TENANT_OCCUPIED", label: "Tenant Occupied" },
  { value: "VACANT", label: "Vacant" },
  { value: "MIXED", label: "Mixed" },
];

export const CAPABILITY_FLAGS: { key: string; label: string }[] = [
  { key: "allowsBridge", label: "Bridge" },
  { key: "allowsDscr", label: "DSCR" },
  { key: "allowsConstruction", label: "Construction" },
  { key: "allowsGroundUp", label: "Ground Up" },
  { key: "allowsFixFlip", label: "Fix & Flip" },
  { key: "allowsMultifamily", label: "Multifamily" },
  { key: "allowsMixedUse", label: "Mixed Use" },
  { key: "allowsRetail", label: "Retail" },
  { key: "allowsOffice", label: "Office" },
  { key: "allowsIndustrial", label: "Industrial" },
  { key: "allowsSelfStorage", label: "Self Storage" },
  { key: "allowsHospitality", label: "Hospitality" },
  { key: "allowsLand", label: "Land" },
];

export const PROGRAM_FLAGS: { key: string; label: string }[] = [
  { key: "isBridge", label: "Bridge" },
  { key: "isPermanent", label: "Permanent" },
  { key: "isConstruction", label: "Construction" },
  { key: "isValueAdd", label: "Value-Add" },
  { key: "isGroundUp", label: "Ground Up" },
  { key: "isFixFlip", label: "Fix & Flip" },
  { key: "isRentalPortfolio", label: "Rental Portfolio" },
  { key: "isCommercial", label: "Commercial" },
  { key: "isResidential", label: "Residential" },
];
