import { prisma } from "@/lib/prisma";
import { emailShell, sendEmail } from "@/lib/email/send";
import { formatCurrency } from "@/lib/utils";
import type { NotificationType } from "@prisma/client";

async function createNotificationForUser(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  relatedLoanRequestId?: string,
  relatedMatchId?: string,
) {
  await prisma.notification.create({
    data: { userId, type, title, body, relatedLoanRequestId, relatedMatchId },
  });
}

/** Loan request submitted → notify every Xtrava admin. */
export async function notifySubmissionReceived(loanRequestId: string) {
  const loanRequest = await prisma.loanRequest.findUniqueOrThrow({
    where: { id: loanRequestId },
    include: { borrower: true },
  });

  const admins = await prisma.user.findMany({
    where: { organizationId: loanRequest.borrower.organizationId, role: "ADMIN" },
  });

  const title = `New loan request from ${loanRequest.borrower.borrowerName}`;
  const body = `${formatCurrency(loanRequest.requestedLoanAmount.toNumber())} · ${loanRequest.propertyState} · ${loanRequest.propertyType}`;

  await Promise.all([
    ...admins.map((admin) => createNotificationForUser(admin.id, "SUBMISSION_RECEIVED", title, body, loanRequestId)),
    ...admins.map((admin) =>
      sendEmail({
        to: admin.email,
        subject: title,
        html: emailShell(
          title,
          `<p>${loanRequest.borrower.borrowerName} (${loanRequest.borrower.email}) submitted a new loan request.</p>
           <p><strong>${formatCurrency(loanRequest.requestedLoanAmount.toNumber())}</strong> · ${loanRequest.propertyType} · ${loanRequest.propertyState}</p>
           <p>The matching engine will score it against every active lender program automatically.</p>`,
        ),
      }),
    ),
  ]);
}

/** A lender program scored well against a loan request → notify that lender. */
export async function notifyLenderMatched(matchId: string) {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: { lender: { include: { user: true } }, loanRequest: { include: { borrower: true } }, loanProgram: true },
  });

  const title = `New ${match.score}% match: ${match.loanRequest.propertyType} in ${match.loanRequest.propertyState}`;
  const body = `${formatCurrency(match.loanRequest.requestedLoanAmount.toNumber())} · ${match.loanProgram?.programName ?? "Loan program"}`;

  if (match.lender.user) {
    await createNotificationForUser(match.lender.user.id, "LENDER_MATCHED", title, body, match.loanRequestId, match.id);
  }

  await sendEmail({
    to: match.lender.email,
    subject: title,
    html: emailShell(
      title,
      `<p>Xtrava Capital has a new deal that fits <strong>${match.loanProgram?.programName ?? "your program"}</strong>.</p>
       <p><strong>${formatCurrency(match.loanRequest.requestedLoanAmount.toNumber())}</strong> · ${match.loanRequest.propertyType} · ${match.loanRequest.propertyState}</p>
       <p>Compatibility score: <strong>${match.score}%</strong></p>
       <p>Log in to your Xtrava Capital dashboard to review the full submission.</p>`,
    ),
  });
}

/** Document uploaded to a loan request → notify admins. */
export async function notifyDocumentUploaded(documentId: string) {
  const document = await prisma.document.findUniqueOrThrow({
    where: { id: documentId },
    include: { loanRequest: { include: { borrower: true } } },
  });
  if (!document.loanRequest) return;

  const admins = await prisma.user.findMany({
    where: { organizationId: document.loanRequest.borrower.organizationId, role: "ADMIN" },
  });

  const title = `${document.loanRequest.borrower.borrowerName} uploaded a ${document.documentType.replace(/_/g, " ").toLowerCase()}`;

  await Promise.all(
    admins.map((admin) => createNotificationForUser(admin.id, "DOCUMENT_UPLOADED", title, document.fileName, document.loanRequestId ?? undefined)),
  );
}

/** Loan request status changed → notify the borrower. */
export async function notifyStatusChanged(loanRequestId: string, newStatus: string) {
  const loanRequest = await prisma.loanRequest.findUniqueOrThrow({
    where: { id: loanRequestId },
    include: { borrower: { include: { user: true } } },
  });

  const title = `Your loan request status changed to ${newStatus.replace(/_/g, " ")}`;

  if (loanRequest.borrower.user) {
    await createNotificationForUser(loanRequest.borrower.user.id, "STATUS_CHANGED", title, undefined, loanRequestId);
  }

  await sendEmail({
    to: loanRequest.borrower.email,
    subject: title,
    html: emailShell(
      title,
      `<p>Hi ${loanRequest.borrower.borrowerName}, your loan request for ${loanRequest.propertyAddress} is now <strong>${newStatus.replace(/_/g, " ")}</strong>.</p>
       <p>Log in to your Xtrava Capital dashboard to see full details and any lender introductions.</p>`,
    ),
  });
}

/** Admin left a comment on a loan request → notify the borrower. */
export async function notifyAdminComment(commentId: string) {
  const comment = await prisma.comment.findUniqueOrThrow({
    where: { id: commentId },
    include: { loanRequest: { include: { borrower: { include: { user: true } } } }, author: true },
  });

  const title = `New comment from ${comment.author.firstName ?? "Xtrava Capital"}`;

  if (comment.loanRequest.borrower.user) {
    await createNotificationForUser(
      comment.loanRequest.borrower.user.id,
      "ADMIN_COMMENT",
      title,
      comment.body,
      comment.loanRequestId,
    );
  }

  await sendEmail({
    to: comment.loanRequest.borrower.email,
    subject: title,
    html: emailShell(title, `<p>${comment.body}</p>`),
  });
}
