"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { titleCase } from "@/lib/utils";

const STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "MATCHED",
  "INTRODUCED",
  "IN_UNDERWRITING",
  "CLOSED_WON",
  "CLOSED_LOST",
  "WITHDRAWN",
];

export function StatusSelector({ loanRequestId, status }: { loanRequestId: string; status: string }) {
  const router = useRouter();

  async function handleChange(next: string) {
    const res = await fetch(`/api/loan-requests/${loanRequestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      toast.success("Status updated");
      router.refresh();
    } else {
      toast.error("Failed to update status");
    }
  }

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger className="w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {titleCase(s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
