import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { withApiErrorHandling, jsonOk, NotFoundError, ForbiddenError } from "@/lib/api-utils";
import { deleteDocument, getSignedDocumentUrl } from "@/lib/storage/supabase";

async function loadScopedDocument(id: string, organizationId: string) {
  const document = await prisma.document.findFirst({
    where: {
      id,
      OR: [{ loanRequest: { borrower: { organizationId } } }, { lender: { organizationId } }],
    },
    include: { loanRequest: true, lender: true },
  });
  if (!document) throw new NotFoundError("Document not found");
  return document;
}

function assertAccess(user: { role: string; borrowerId: string | null; lenderId: string | null }, document: { loanRequest: { borrowerId: string } | null; lenderId: string | null }) {
  if (user.role === "ADMIN") return;
  if (user.role === "BORROWER" && document.loanRequest?.borrowerId === user.borrowerId) return;
  if (user.role === "LENDER" && document.lenderId === user.lenderId) return;
  throw new ForbiddenError();
}

export const GET = withApiErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const document = await loadScopedDocument(id, user.organizationId);
  assertAccess(user, document);

  const signedUrl = await getSignedDocumentUrl(document.storagePath);
  return jsonOk({ document, signedUrl });
});

export const DELETE = withApiErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const document = await loadScopedDocument(id, user.organizationId);
  assertAccess(user, document);

  await deleteDocument(document.storagePath);
  await prisma.document.delete({ where: { id } });

  return jsonOk({ success: true });
});
