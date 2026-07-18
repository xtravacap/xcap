import { NextRequest } from "next/server";
import { after } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { withApiErrorHandling, jsonOk, NotFoundError, ForbiddenError } from "@/lib/api-utils";
import { documentCreateSchema } from "@/lib/validation/document";
import { buildStoragePath, uploadDocument } from "@/lib/storage/supabase";
import { notifyDocumentUploaded } from "@/lib/notify";
import { applyLoanDocumentExtraction } from "@/lib/ai/apply-extraction";
import { parseLenderGuidelinesAndUpsertPrograms } from "@/lib/ai/parse-lender-guidelines";

const EXTRACTABLE_BORROWER_DOC_TYPES = new Set([
  "PURCHASE_CONTRACT",
  "RENT_ROLL",
  "FINANCIALS",
  "APPRAISAL",
  "OPERATING_STATEMENT",
]);
const LENDER_GUIDELINE_DOC_TYPES = new Set(["LENDER_MATRIX", "LENDER_GUIDELINES"]);

export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const user = await requireApiUser();
  const { searchParams } = new URL(req.url);
  const loanRequestId = searchParams.get("loanRequestId");
  const lenderId = searchParams.get("lenderId");

  const documents = await prisma.document.findMany({
    where: {
      OR: [{ loanRequest: { borrower: { organizationId: user.organizationId } } }, { lender: { organizationId: user.organizationId } }],
      ...(loanRequestId ? { loanRequestId } : {}),
      ...(lenderId ? { lenderId } : {}),
      ...(user.role === "BORROWER" ? { loanRequest: { borrowerId: user.borrowerId ?? "__none__" } } : {}),
      ...(user.role === "LENDER" ? { lenderId: user.lenderId ?? "__none__" } : {}),
    },
    include: { uploadedBy: { select: { firstName: true, lastName: true } }, loanRequest: { select: { propertyAddress: true } } },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk({ documents });
});

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const user = await requireApiUser();
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("A file is required");

  const loanRequestId = (formData.get("loanRequestId") as string | null) || null;
  const lenderId = (formData.get("lenderId") as string | null) || null;

  if (loanRequestId) {
    const loanRequest = await prisma.loanRequest.findFirst({ where: { id: loanRequestId, borrower: { organizationId: user.organizationId } } });
    if (!loanRequest) throw new NotFoundError("Loan request not found");
    if (user.role === "BORROWER" && user.borrowerId !== loanRequest.borrowerId) throw new ForbiddenError();
  }
  if (lenderId) {
    const lender = await prisma.lender.findFirst({ where: { id: lenderId, organizationId: user.organizationId } });
    if (!lender) throw new NotFoundError("Lender not found");
    if (user.role === "LENDER" && user.lenderId !== lenderId) throw new ForbiddenError();
    if (user.role === "BORROWER") throw new ForbiddenError();
  }

  const body = documentCreateSchema.parse({
    loanRequestId,
    lenderId,
    documentType: formData.get("documentType"),
    fileName: file.name,
    storagePath: "pending",
    fileSize: file.size,
    mimeType: file.type,
  });

  const storagePath = buildStoragePath({ loanRequestId: loanRequestId ?? undefined, lenderId: lenderId ?? undefined }, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadDocument(storagePath, buffer, file.type || "application/octet-stream");

  const isExtractable = EXTRACTABLE_BORROWER_DOC_TYPES.has(body.documentType) || LENDER_GUIDELINE_DOC_TYPES.has(body.documentType);

  const document = await prisma.document.create({
    data: {
      loanRequestId,
      lenderId,
      documentType: body.documentType,
      fileName: body.fileName,
      storagePath,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      uploadedById: user.id,
      extractionStatus: isExtractable ? "PENDING" : "NOT_APPLICABLE",
    },
  });

  if (loanRequestId) {
    after(async () => {
      try {
        await notifyDocumentUploaded(document.id);
      } catch (error) {
        console.error("Document-uploaded notification failed", error);
      }
    });
  }

  if (EXTRACTABLE_BORROWER_DOC_TYPES.has(body.documentType)) {
    after(async () => {
      try {
        await applyLoanDocumentExtraction(document.id);
      } catch (error) {
        console.error("AI document extraction failed", error);
      }
    });
  } else if (LENDER_GUIDELINE_DOC_TYPES.has(body.documentType) && lenderId) {
    after(async () => {
      try {
        await parseLenderGuidelinesAndUpsertPrograms(lenderId, buffer, body.mimeType ?? "application/octet-stream", body.fileName);
        await prisma.document.update({ where: { id: document.id }, data: { extractionStatus: "COMPLETED" } });
      } catch (error) {
        console.error("AI lender guideline parsing failed", error);
        await prisma.document.update({ where: { id: document.id }, data: { extractionStatus: "FAILED" } });
      }
    });
  }

  return jsonOk({ document }, { status: 201 });
});
