import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentsTable } from "@/components/documents/documents-table";

export default async function DocumentsPage() {
  const user = await requireRole("ADMIN", "BORROWER");

  const documents = await prisma.document.findMany({
    where: {
      loanRequest: { borrower: { organizationId: user.organizationId } },
      ...(user.role === "BORROWER" ? { loanRequest: { borrowerId: user.borrowerId ?? "__none__" } } : {}),
    },
    include: {
      loanRequest: { select: { id: true, propertyAddress: true } },
      uploadedBy: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="text-muted-foreground text-sm">Every file uploaded across active loan requests.</p>
      </div>
      <DocumentsTable
        documents={documents.map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          documentType: doc.documentType,
          extractionStatus: doc.extractionStatus,
          createdAt: doc.createdAt,
          context: doc.loanRequest?.propertyAddress ?? "—",
          contextHref: doc.loanRequest ? `/loan-requests/${doc.loanRequest.id}` : null,
          uploadedBy: doc.uploadedBy ? `${doc.uploadedBy.firstName ?? ""} ${doc.uploadedBy.lastName ?? ""}`.trim() || doc.uploadedBy.email : "—",
        }))}
      />
    </div>
  );
}
