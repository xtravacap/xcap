"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { loanProgramSchema, type LoanProgramInput } from "@/lib/validation/loan-program";
import { typedZodResolver } from "@/lib/form-resolver";
import { LOAN_PURPOSE_OPTIONS, LOAN_TYPE_OPTIONS, PROGRAM_FLAGS, PROPERTY_TYPE_OPTIONS, US_STATES } from "@/lib/constants";
import { MultiSelect } from "@/components/forms/multi-select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const STATE_OPTIONS = US_STATES.map((s) => ({ value: s, label: s }));

export function LoanProgramForm({
  programId,
  lenders,
  defaultValues,
}: {
  programId?: string;
  lenders?: { id: string; companyName: string }[];
  defaultValues: LoanProgramInput;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<LoanProgramInput>({
    resolver: typedZodResolver(loanProgramSchema),
    defaultValues,
  });
  const values = form.watch();

  async function onSubmit(data: LoanProgramInput) {
    setSubmitting(true);
    try {
      const res = await fetch(programId ? `/api/loan-programs/${programId}` : "/api/loan-programs", {
        method: programId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save program");
      }
      const result = await res.json();
      toast.success(programId ? "Program updated" : "Program created");
      router.push(`/lenders/${result.program.lenderId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          {lenders && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Lender</Label>
              <Select value={values.lenderId} onValueChange={(v) => form.setValue("lenderId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a lender" />
                </SelectTrigger>
                <SelectContent>
                  {lenders.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Program name</Label>
            <Input {...form.register("programName")} placeholder="e.g. Bridge 12-24mo" />
          </div>
          <div className="space-y-1.5">
            <Label>Loan type</Label>
            <Select value={values.loanType} onValueChange={(v) => form.setValue("loanType", v as never)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOAN_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Purposes covered</Label>
            <MultiSelect options={LOAN_PURPOSE_OPTIONS} value={values.purposes} onChange={(v) => form.setValue("purposes", v as never)} />
          </div>
          <div className="space-y-1.5">
            <Label>Minimum loan</Label>
            <Input type="number" {...form.register("minLoanAmount")} />
          </div>
          <div className="space-y-1.5">
            <Label>Maximum loan</Label>
            <Input type="number" {...form.register("maxLoanAmount")} />
          </div>
          <div className="space-y-1.5">
            <Label>Min DSCR</Label>
            <Input type="number" step="0.01" {...form.register("minDscr")} />
          </div>
          <div className="space-y-1.5">
            <Label>Max LTV (%)</Label>
            <Input type="number" {...form.register("maxLtv")} />
          </div>
          <div className="space-y-1.5">
            <Label>Max LTC (%)</Label>
            <Input type="number" {...form.register("maxLtc")} />
          </div>
          <div className="space-y-1.5">
            <Label>Term (months)</Label>
            <Input type="number" {...form.register("termMonths")} />
          </div>
          <div className="space-y-1.5">
            <Label>Interest rate range (%)</Label>
            <div className="flex gap-2">
              <Input type="number" step="0.01" {...form.register("interestRateMin")} placeholder="Min" />
              <Input type="number" step="0.01" {...form.register("interestRateMax")} placeholder="Max" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Amortization (months)</Label>
            <Input type="number" {...form.register("amortizationMonths")} />
          </div>
          <div className="flex items-center gap-2 self-end pb-2">
            <Switch checked={values.interestOnly} onCheckedChange={(v) => form.setValue("interestOnly", v)} />
            <Label>Interest-only available</Label>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Property types</Label>
            <MultiSelect options={PROPERTY_TYPE_OPTIONS} value={values.propertyTypes} onChange={(v) => form.setValue("propertyTypes", v as never)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Allowed states</Label>
            <MultiSelect options={STATE_OPTIONS} value={values.allowedStates} onChange={(v) => form.setValue("allowedStates", v as never)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Prepayment</Label>
            <Textarea rows={2} {...form.register("prepayment")} placeholder="e.g. 3-2-1 step down" />
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-2 block">Program flags</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PROGRAM_FLAGS.map((flag) => (
                <label key={flag.key} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                  <Checkbox
                    checked={Boolean(values[flag.key as keyof LoanProgramInput])}
                    onCheckedChange={(checked) => form.setValue(flag.key as keyof LoanProgramInput, Boolean(checked) as never)}
                  />
                  {flag.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Switch checked={values.isActive} onCheckedChange={(v) => form.setValue("isActive", v)} />
            <Label>Active program</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : programId ? "Save changes" : "Create program"}
        </Button>
      </div>
    </form>
  );
}
