"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { FileUpload } from "@/components/documents/file-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, titleCase } from "@/lib/utils";

export interface DocumentItem {
  id: string;
  fileName: string;
  documentType: string;
  extractionStatus: string;
  createdAt: string | Date;
}

const DOCUMENT_TYPES: { key: string; label: string; accept?: string }[] = [
  { key: "PURCHASE_CONTRACT", label: "Purchase Contract" },
  { key: "RENT_ROLL", label: "Rent Roll" },
  { key: "FINANCIALS", label: "Financials" },
  { key: "TAX_RETURNS", label: "Tax Returns" },
  { key: "BANK_STATEMENTS", label: "Bank Statements" },
  { key: "APPRAISAL", label: "Appraisal" },
  { key: "OPERATING_STATEMENT", label: "Operating Statement" },
  { key: "PHOTOS", label: "Property Photos", accept: "image/*" },
  { key: "EXECUTIVE_SUMMARY", label: "Executive Summary" },
];

const EXTRACTION_VARIANT: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  NOT_APPLICABLE: "secondary",
  PENDING: "secondary",
  PROCESSING: "warning",
  COMPLETED: "success",
  FAILED: "destructive",
};

export function DocumentsPanel({
  loanRequestId,
  documents,
  canUpload,
}: {
  loanRequestId: string;
  documents: DocumentItem[];
  canUpload: boolean;
}) {
  const router = useRouter();

  async function download(id: string) {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) {
      toast.error("Failed to get document link");
      return;
    }
    const data = await res.json();
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOCUMENT_TYPES.map((doc) => (
            <FileUpload
              key={doc.key}
              label={doc.label}
              documentType={doc.key}
              loanRequestId={loanRequestId}
              accept={doc.accept}
              onUploaded={() => router.refresh()}
            />
          ))}
        </div>
      )}

      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <div>
              <p className="font-medium">{doc.fileName}</p>
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                {titleCase(doc.documentType)} · {formatDate(doc.createdAt)}
                {doc.extractionStatus !== "NOT_APPLICABLE" && (
                  <span className="ml-1 inline-flex items-center gap-1">
                    <Sparkles className="size-3" /> AI extraction
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={EXTRACTION_VARIANT[doc.extractionStatus] ?? "secondary"}>{titleCase(doc.extractionStatus)}</Badge>
              <Button variant="ghost" size="icon" onClick={() => download(doc.id)}>
                <Download className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        {documents.length === 0 && <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>}
      </div>
    </div>
  );
}
