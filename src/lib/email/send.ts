import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Thin Resend wrapper. Without RESEND_API_KEY configured (e.g. local dev),
 * this logs instead of throwing so the rest of the app (notifications,
 * matching, intake) works end-to-end without an email provider.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!resend) {
    console.log(`[email:dev] to=${Array.isArray(to) ? to.join(",") : to} subject="${subject}"`);
    return { skipped: true as const };
  }

  return resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Xtrava Capital <notifications@xtravacapital.com>",
    to,
    subject,
    html,
  });
}

export function emailShell(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; background: #f4f4f5; padding: 32px 0; margin: 0;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7;">
        <tr><td style="background: #1c1c28; padding: 20px 28px;">
          <span style="color: #fff; font-weight: 600; font-size: 16px;">Xtrava Capital</span>
        </td></tr>
        <tr><td style="padding: 28px;">
          <h1 style="font-size: 18px; margin: 0 0 12px;">${title}</h1>
          <div style="font-size: 14px; color: #3f3f46; line-height: 1.6;">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding: 16px 28px; background: #fafafa; font-size: 11px; color: #a1a1aa;">
          Xtrava Capital — commercial real estate capital advisory
        </td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`;
}
