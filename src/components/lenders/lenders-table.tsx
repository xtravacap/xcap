"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, Plus, Search } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCompactCurrency } from "@/lib/utils";

export interface LenderRow {
  id: string;
  companyName: string;
  primaryContact: string;
  email: string;
  states: string[];
  minLoanAmount: number;
  maxLoanAmount: number;
  isActive: boolean;
  programCount: number;
  matchCount: number;
}

type SortKey = "companyName" | "maxLoanAmount" | "programCount" | "matchCount";

export function LendersTable({ lenders }: { lenders: LenderRow[] }) {
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("companyName");
  const [sortDir, setSortDir] = React.useState<1 | -1>(1);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  const filtered = lenders.filter((lender) => {
    const q = query.toLowerCase();
    return (
      lender.companyName.toLowerCase().includes(q) ||
      lender.primaryContact.toLowerCase().includes(q) ||
      lender.states.some((s) => s.toLowerCase() === q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * sortDir;
    return ((av as number) - (bv as number)) * sortDir;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input placeholder="Search lenders…" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Button asChild>
          <Link href="/lenders/new">
            <Plus /> Add lender
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button className="flex items-center gap-1" onClick={() => toggleSort("companyName")}>
                  Company <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>States</TableHead>
              <TableHead>
                <button className="flex items-center gap-1" onClick={() => toggleSort("maxLoanAmount")}>
                  Loan range <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>
                <button className="flex items-center gap-1" onClick={() => toggleSort("programCount")}>
                  Programs <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>
                <button className="flex items-center gap-1" onClick={() => toggleSort("matchCount")}>
                  Matches <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((lender) => (
              <TableRow key={lender.id} className="cursor-pointer" onClick={() => (window.location.href = `/lenders/${lender.id}`)}>
                <TableCell className="font-medium">{lender.companyName}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{lender.primaryContact}</span>
                    <span className="text-muted-foreground text-xs">{lender.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {lender.states.slice(0, 4).map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                    {lender.states.length > 4 && <Badge variant="outline">+{lender.states.length - 4}</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  {formatCompactCurrency(lender.minLoanAmount)}–{formatCompactCurrency(lender.maxLoanAmount)}
                </TableCell>
                <TableCell>{lender.programCount}</TableCell>
                <TableCell>{lender.matchCount}</TableCell>
                <TableCell>
                  <Badge variant={lender.isActive ? "success" : "outline"}>{lender.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                  No lenders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
