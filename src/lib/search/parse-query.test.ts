import { describe, expect, it } from "vitest";
import { parseLenderSearchQuery } from "./parse-query";

describe("parseLenderSearchQuery", () => {
  it("parses a loan type + state query", () => {
    const { where, interpretation } = parseLenderSearchQuery("Bridge lenders in NJ");
    expect(where.loanTypes).toEqual({ has: "BRIDGE" });
    expect(where.states).toEqual({ has: "NJ" });
    expect(interpretation.join(", ")).toContain("BRIDGE");
    expect(interpretation.join(", ")).toContain("NJ");
  });

  it("parses a loan type + amount threshold query", () => {
    const { where } = parseLenderSearchQuery("DSCR lenders over $2M");
    expect(where.loanTypes).toEqual({ has: "DSCR" });
    expect(where.maxLoanAmount).toEqual({ gte: 2_000_000 });
  });

  it("parses a full state name", () => {
    const { where } = parseLenderSearchQuery("Construction lenders in Pennsylvania");
    expect(where.loanTypes).toEqual({ has: "CONSTRUCTION" });
    expect(where.states).toEqual({ has: "PA" });
  });

  it("parses an LTV threshold query", () => {
    const { where } = parseLenderSearchQuery("LTV over 80%");
    expect(where.maxLtv).toEqual({ gte: 80 });
  });

  it("parses a property type only query", () => {
    const { where } = parseLenderSearchQuery("Hospitality lenders");
    expect(where.propertyTypes).toEqual({ has: "HOSPITALITY" });
  });

  it("parses mixed-use property type", () => {
    const { where } = parseLenderSearchQuery("Mixed-use lenders");
    expect(where.propertyTypes).toEqual({ has: "MIXED_USE" });
  });

  it("returns an empty filter for unrecognized free text", () => {
    const { where, interpretation } = parseLenderSearchQuery("Acme Capital");
    expect(where).toEqual({});
    expect(interpretation).toHaveLength(0);
  });
});
