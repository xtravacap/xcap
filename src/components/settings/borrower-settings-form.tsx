"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { borrowerContactSchema } from "@/lib/validation/loan-request";
import { typedZodResolver } from "@/lib/form-resolver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { z } from "zod";

type BorrowerSettingsInput = z.infer<typeof borrowerContactSchema>;

export function BorrowerSettingsForm({ borrowerId, defaultValues }: { borrowerId: string; defaultValues: BorrowerSettingsInput }) {
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<BorrowerSettingsInput>({ resolver: typedZodResolver(borrowerContactSchema), defaultValues });

  async function onSubmit(values: BorrowerSettingsInput) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/borrowers/${borrowerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input {...form.register("borrowerName")} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input {...form.register("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label>Business name</Label>
            <Input {...form.register("businessName")} />
          </div>
          <div className="space-y-1.5">
            <Label>Credit score</Label>
            <Input type="number" {...form.register("creditScore")} />
          </div>
          <div className="space-y-1.5">
            <Label>Liquidity</Label>
            <Input type="number" {...form.register("liquidity")} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
