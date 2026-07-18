import { requireRole } from "@/lib/auth";
import { LenderForm } from "@/components/lenders/lender-form";

export default async function NewLenderPage() {
  await requireRole("ADMIN");

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add lender</h1>
        <p className="text-muted-foreground text-sm">Set up a new capital partner and their lending box.</p>
      </div>
      <LenderForm />
    </div>
  );
}
