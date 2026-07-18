"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCompactCurrency, formatPercent, titleCase } from "@/lib/utils";

export interface LoanProgramRow {
  id: string;
  programName: string;
  loanType: string;
  minLoanAmount: number;
  maxLoanAmount: number;
  maxLtv: number | null;
  maxLtc: number | null;
  minDscr: number | null;
  isActive: boolean;
}

export function LenderProgramsList({ lenderId, programs }: { lenderId: string; programs: LoanProgramRow[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Delete this loan program?")) return;
    const res = await fetch(`/api/loan-programs/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Program deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete program");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link href={`/loan-programs/new?lenderId=${lenderId}`}>
            <Plus /> Add program
          </Link>
        </Button>
      </div>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead>
              <TableHead>Loan type</TableHead>
              <TableHead>Loan range</TableHead>
              <TableHead>Max LTV / LTC</TableHead>
              <TableHead>Min DSCR</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="font-medium">
                  <Link href={`/loan-programs/${program.id}`} className="hover:underline">
                    {program.programName}
                  </Link>
                </TableCell>
                <TableCell>{titleCase(program.loanType)}</TableCell>
                <TableCell>
                  {formatCompactCurrency(program.minLoanAmount)}–{formatCompactCurrency(program.maxLoanAmount)}
                </TableCell>
                <TableCell>
                  {formatPercent(program.maxLtv)} / {formatPercent(program.maxLtc)}
                </TableCell>
                <TableCell>{program.minDscr ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={program.isActive ? "success" : "outline"}>{program.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(program.id)}>
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {programs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  No loan programs yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
