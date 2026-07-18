"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { RequestStatusBadge } from "@/components/dashboard/status-badge";
import { formatCompactCurrency, formatDate, titleCase } from "@/lib/utils";

export interface BorrowerRow {
  id: string;
  borrowerName: string;
  email: string;
  businessName: string | null;
  loanRequestCount: number;
  latestRequest: {
    id: string;
    status: string;
    requestedLoanAmount: number;
    propertyType: string;
    propertyState: string;
    createdAt: string | Date;
  } | null;
}

export function BorrowersTable({ borrowers }: { borrowers: BorrowerRow[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  const filtered = borrowers.filter((b) => {
    const q = query.toLowerCase();
    return b.borrowerName.toLowerCase().includes(q) || b.email.toLowerCase().includes(q) || (b.businessName ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input placeholder="Search borrowers…" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Borrower</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Latest request</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id} className="cursor-pointer" onClick={() => router.push(`/borrowers/${b.id}`)}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{b.borrowerName}</span>
                    <span className="text-muted-foreground text-xs">{b.email}</span>
                  </div>
                </TableCell>
                <TableCell>{b.businessName || "—"}</TableCell>
                <TableCell>
                  {b.latestRequest ? `${titleCase(b.latestRequest.propertyType)} · ${b.latestRequest.propertyState}` : "—"}
                </TableCell>
                <TableCell>{b.latestRequest ? formatCompactCurrency(b.latestRequest.requestedLoanAmount) : "—"}</TableCell>
                <TableCell>{b.latestRequest ? <RequestStatusBadge status={b.latestRequest.status} /> : "—"}</TableCell>
                <TableCell>{b.latestRequest ? formatDate(b.latestRequest.createdAt) : "—"}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                  No borrowers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
