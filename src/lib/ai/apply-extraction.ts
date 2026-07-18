import "server-only";

import { prisma } from "@/lib/prisma";
import { supabaseAdmin, DOCUMENTS_BUCKET } from "@/lib/storage/supabase";
import { extractLoanDocument } from "./extract-loan-document";
import { mapKeywordOptional, PROPERTY_TYPE_KEYWORDS, normalizeState } from "./enum-mapping";

/**
 * Downloads a previously-uploaded borrower document from Supabase Storage,
 * runs AI extraction, stores the raw result on the Document row, and fills
 * in any still-empty fields on the parent LoanRequest (never overwrites data
 * the borrower already provided).
 */
export async function applyLoanDocumentExtraction(documentId: string) {
  const document = await prisma.document.findUniqueOrThrow({
    where: { id: documentId },
    include: { loanRequest: true },
  });

  await prisma.document.update({ where: { id: documentId }, data: { extractionStatus: "PROCESSING" } });

  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).download(document.storagePath);
    if (error || !data) throw error ?? new Error("File not found in storage");
    const buffer = Buffer.from(await data.arrayBuffer());

    const extraction = await extractLoanDocument({
      buffer,
      mimeType: document.mimeType ?? "application/octet-stream",
      fileName: document.fileName,
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { extractionStatus: "COMPLETED", extractedData: extraction },
    });

    if (document.loanRequest) {
      const lr = document.loanRequest;
      const propertyType = extraction.propertyType ? mapKeywordOptional(extraction.propertyType, PROPERTY_TYPE_KEYWORDS) : null;
      const propertyState = extraction.propertyState ? normalizeState(extraction.propertyState) : null;

      await prisma.loanRequest.update({
        where: { id: lr.id },
        data: {
          purchasePrice: lr.purchasePrice ?? extraction.purchasePrice ?? undefined,
          propertyValue: lr.propertyValue ?? extraction.purchasePrice ?? undefined,
          noi: lr.noi ?? extraction.noi ?? undefined,
          dscr: lr.dscr ?? extraction.dscr ?? undefined,
          capRate: lr.capRate ?? extraction.capRate ?? undefined,
          propertyCity: lr.propertyCity ?? extraction.propertyCity ?? undefined,
          propertyType: propertyType ?? undefined,
          ...(propertyState && !lr.propertyState ? { propertyState } : {}),
        },
      });
    }

    return extraction;
  } catch (error) {
    await prisma.document.update({ where: { id: documentId }, data: { extractionStatus: "FAILED" } });
    throw error;
  }
}
