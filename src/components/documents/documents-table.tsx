"use client";

import * as React from "react";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, titleCase } from "@/lib/utils";

export interface DocumentRow {
  id: string;
  fileName: string;
  documentType: string;
  extractionStatus: string;
  createdAt: string | Date;
  context: string;
  contextHref: string | null;
  uploadedBy: string;
}

const EXTRACTION_VARIANT: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  NOT_APPLICABLE: "secondary",
  PENDING: "secondary",
  PROCESSING: "warning",
  COMPLETED: "success",
  FAILED: "destructive",
};

export function DocumentsTable({ documents }: { documents: DocumentRow[] }) {
  const [query, setQuery] = React.useState("");

  async function download(id: string) {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) {
      toast.error("Failed to get document link");
      return;
    }
    const data = await res.json();
    window.open(data.signedUrl, "_blank");
  }

  const filtered = documents.filter((d) => {
    const q = query.toLowerCase();
    return d.fileName.toLowerCase().includes(q) || d.context.toLowerCase().includes(q) || d.documentType.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input placeholder="Search documents…" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Related to</TableHead>
              <TableHead>Uploaded by</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>AI extraction</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.fileName}</TableCell>
                <TableCell>{titleCase(doc.documentType)}</TableCell>
                <TableCell>
                  {doc.contextHref ? (
                    <a href={doc.contextHref} className="hover:underline">
                      {doc.context}
                    </a>
                  ) : (
                    doc.context
                  )}
                </TableCell>
                <TableCell>{doc.uploadedBy}</TableCell>
                <TableCell>{formatDate(doc.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={EXTRACTION_VARIANT[doc.extractionStatus] ?? "secondary"}>{titleCase(doc.extractionStatus)}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => download(doc.id)}>
                    <Download className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                  No documents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
