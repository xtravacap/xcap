"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { FileUpload } from "@/components/documents/file-upload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, titleCase } from "@/lib/utils";

export interface LenderDocumentRow {
  id: string;
  fileName: string;
  documentType: string;
  extractionStatus: string;
  createdAt: string | Date;
}

const EXTRACTION_VARIANT: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  NOT_APPLICABLE: "secondary",
  PENDING: "secondary",
  PROCESSING: "warning",
  COMPLETED: "success",
  FAILED: "destructive",
};

export function LenderDocumentsPanel({ lenderId, documents }: { lenderId: string; documents: LenderDocumentRow[] }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="text-primary size-4" /> Upload loan matrix / guidelines
          </CardTitle>
          <CardDescription>
            PDF, Excel, Word, or CSV. Xtrava&apos;s AI reads the document and automatically creates/updates this
            lender&apos;s loan programs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <FileUpload
            label="Loan matrix"
            documentType="LENDER_MATRIX"
            lenderId={lenderId}
            accept=".pdf,.xlsx,.xls,.csv"
            onUploaded={() => router.refresh()}
          />
          <FileUpload
            label="Lending guidelines"
            documentType="LENDER_GUIDELINES"
            lenderId={lenderId}
            accept=".pdf,.doc,.docx,.csv"
            onUploaded={() => router.refresh()}
          />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <div>
              <p className="font-medium">{doc.fileName}</p>
              <p className="text-muted-foreground text-xs">
                {titleCase(doc.documentType)} · {formatDate(doc.createdAt)}
              </p>
            </div>
            <Badge variant={EXTRACTION_VARIANT[doc.extractionStatus] ?? "secondary"}>{titleCase(doc.extractionStatus)}</Badge>
          </div>
        ))}
        {documents.length === 0 && <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>}
      </div>
    </div>
  );
}
