"use client";

import * as React from "react";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  documentType: string;
  loanRequestId?: string;
  lenderId?: string;
  accept?: string;
  onUploaded?: (document: unknown) => void;
}

/** Drag-and-drop (or click-to-browse) uploader that POSTs straight to
 * /api/documents as multipart form data. */
export function FileUpload({ label, documentType, loanRequestId, lenderId, accept, onUploaded }: FileUploadProps) {
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadedName, setUploadedName] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      if (loanRequestId) formData.append("loanRequestId", loanRequestId);
      if (lenderId) formData.append("lenderId", lenderId);

      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const data = await res.json();
      setUploadedName(file.name);
      toast.success(`${label} uploaded`);
      onUploaded?.(data.document);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
        dragging ? "border-primary bg-accent/50" : "border-border hover:border-primary/50",
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) upload(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      {uploading ? (
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      ) : uploadedName ? (
        <CheckCircle2 className="text-success size-5" />
      ) : (
        <UploadCloud className="text-muted-foreground size-5" />
      )}
      <p className="text-sm font-medium">{label}</p>
      <p className="text-muted-foreground text-xs">{uploadedName ?? "Drag & drop or click to browse"}</p>
    </div>
  );
}
