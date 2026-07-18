import Link from "next/link";
import { Plus } from "lucide-react";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCompactCurrency, formatPercent, titleCase } from "@/lib/utils";

export default async function LoanProgramsPage() {
  const user = await requireRole("ADMIN", "LENDER");

  const programs = await prisma.loanProgram.findMany({
    where: {
      lender: { organizationId: user.organizationId },
      ...(user.role === "LENDER" ? { lenderId: user.lenderId ?? "__none__" } : {}),
    },
    include: { lender: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Loan Programs</h1>
          <p className="text-muted-foreground text-sm">Every structured program across your lender network.</p>
        </div>
        <Button asChild>
          <Link href="/loan-programs/new">
            <Plus /> Add program
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead>
              <TableHead>Lender</TableHead>
              <TableHead>Loan type</TableHead>
              <TableHead>Loan range</TableHead>
              <TableHead>Max LTV / LTC</TableHead>
              <TableHead>Status</TableHead>
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
                <TableCell>
                  <Link href={`/lenders/${program.lender.id}`} className="hover:underline">
                    {program.lender.companyName}
                  </Link>
                </TableCell>
                <TableCell>{titleCase(program.loanType)}</TableCell>
                <TableCell>
                  {formatCompactCurrency(Number(program.minLoanAmount))}–{formatCompactCurrency(Number(program.maxLoanAmount))}
                </TableCell>
                <TableCell>
                  {formatPercent(program.maxLtv)} / {formatPercent(program.maxLtc)}
                </TableCell>
                <TableCell>
                  <Badge variant={program.isActive ? "success" : "outline"}>{program.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {programs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
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
