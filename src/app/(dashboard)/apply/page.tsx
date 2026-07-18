import { requireRole } from "@/lib/auth";
import { LoanRequestForm } from "@/components/intake/loan-request-form";

export default async function ApplyPage() {
  await requireRole("ADMIN", "BORROWER");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Submit a financing request</h1>
        <p className="text-muted-foreground text-sm">
          Tell us about the deal — our matching engine scores it against every active lender program instantly.
        </p>
      </div>
      <LoanRequestForm />
    </div>
  );
}
