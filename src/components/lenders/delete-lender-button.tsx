"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function DeleteLenderButton({ lenderId }: { lenderId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this lender? This cannot be undone.")) return;
    const res = await fetch(`/api/lenders/${lenderId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Lender deleted");
      router.push("/lenders");
      router.refresh();
    } else {
      toast.error("Failed to delete lender");
    }
  }

  return (
    <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleDelete}>
      <Trash2 /> Delete
    </Button>
  );
}
