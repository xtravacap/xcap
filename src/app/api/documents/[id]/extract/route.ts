import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { withApiErrorHandling, jsonOk, NotFoundError } from "@/lib/api-utils";
import { applyLoanDocumentExtraction } from "@/lib/ai/apply-extraction";
import { parseLenderGuidelinesAndUpsertPrograms } from "@/lib/ai/parse-lender-guidelines";
import { supabaseAdmin, DOCUMENTS_BUCKET } from "@/lib/storage/supabase";

/** Manually (re-)triggers AI extraction/parsing for a document — useful if the automatic pass failed. */
export const POST = withApiErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiRole("ADMIN");
  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: { id, OR: [{ loanRequest: { borrower: { organizationId: user.organizationId } } }, { lender: { organizationId: user.organizationId } }] },
  });
  if (!document) throw new NotFoundError("Document not found");

  if (document.lenderId && ["LENDER_MATRIX", "LENDER_GUIDELINES"].includes(document.documentType)) {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).download(document.storagePath);
    if (error || !data) throw error ?? new Error("File not found in storage");
    const buffer = Buffer.from(await data.arrayBuffer());
    const programs = await parseLenderGuidelinesAndUpsertPrograms(document.lenderId, buffer, document.mimeType ?? "application/octet-stream", document.fileName);
    await prisma.document.update({ where: { id }, data: { extractionStatus: "COMPLETED" } });
    return jsonOk({ programs });
  }

  const extraction = await applyLoanDocumentExtraction(id);
  return jsonOk({ extraction });
});
