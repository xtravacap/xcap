"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

import { loanRequestSubmissionSchema, type LoanRequestSubmissionInput } from "@/lib/validation/loan-request";
import { typedZodResolver } from "@/lib/form-resolver";
import { LOAN_PURPOSE_OPTIONS, OCCUPANCY_OPTIONS, PROPERTY_TYPE_OPTIONS, RECOURSE_OPTIONS, US_STATES } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUpload } from "@/components/documents/file-upload";

const DEFAULT_VALUES: LoanRequestSubmissionInput = {
  borrower: {
    borrowerName: "",
    email: "",
    phone: "",
    businessName: "",
    entityType: "",
    experienceYears: undefined as unknown as number,
    creditScore: undefined as unknown as number,
    liquidity: undefined as unknown as number,
    netWorth: undefined as unknown as number,
  },
  loanRequest: {
    requestedLoanAmount: undefined as unknown as number,
    purchasePrice: undefined as unknown as number,
    propertyValue: undefined as unknown as number,
    ltv: undefined as unknown as number,
    ltc: undefined as unknown as number,
    dscr: undefined as unknown as number,
    noi: undefined as unknown as number,
    capRate: undefined as unknown as number,
    propertyAddress: "",
    propertyCity: "",
    propertyState: "",
    propertyZip: "",
    propertyType: "MULTIFAMILY",
    occupancy: undefined,
    loanPurpose: "PURCHASE",
    recoursePreference: undefined,
    timelineDays: undefined as unknown as number,
    closingDate: undefined,
    exitStrategy: "",
    notes: "",
  },
};

const DOCUMENT_TYPES: { key: string; label: string; accept?: string }[] = [
  { key: "PURCHASE_CONTRACT", label: "Purchase Contract" },
  { key: "RENT_ROLL", label: "Rent Roll" },
  { key: "FINANCIALS", label: "Financials" },
  { key: "TAX_RETURNS", label: "Tax Returns" },
  { key: "BANK_STATEMENTS", label: "Bank Statements" },
  { key: "APPRAISAL", label: "Appraisal" },
  { key: "PHOTOS", label: "Property Photos", accept: "image/*" },
  { key: "EXECUTIVE_SUMMARY", label: "Executive Summary" },
];

export function LoanRequestForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [createdId, setCreatedId] = React.useState<string | null>(null);

  const form = useForm<LoanRequestSubmissionInput>({
    resolver: typedZodResolver(loanRequestSubmissionSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const values = form.watch();

  async function onSubmit(data: LoanRequestSubmissionInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/loan-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to submit request");
      }
      const result = await res.json();
      setCreatedId(result.loanRequest.id);
      toast.success("Loan request submitted! Now upload any supporting documents.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdId) {
    return (
      <div className="space-y-6">
        <Card className="border-success/40 bg-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-success size-5" /> Request submitted
            </CardTitle>
            <CardDescription>
              Xtrava&apos;s matching engine is scoring your deal against every active lender program right now.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload supporting documents</CardTitle>
            <CardDescription>Optional, but the more we have the faster (and more accurate) your matches.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {DOCUMENT_TYPES.map((doc) => (
              <FileUpload key={doc.key} label={doc.label} documentType={doc.key} loanRequestId={createdId} accept={doc.accept} />
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
          >
            Done — go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Borrower information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input {...form.register("borrower.borrowerName")} /></Field>
          <Field label="Email"><Input type="email" {...form.register("borrower.email")} /></Field>
          <Field label="Phone"><Input {...form.register("borrower.phone")} /></Field>
          <Field label="Business name"><Input {...form.register("borrower.businessName")} /></Field>
          <Field label="Entity"><Input {...form.register("borrower.entityType")} placeholder="e.g. LLC" /></Field>
          <Field label="Years of experience"><Input type="number" {...form.register("borrower.experienceYears")} /></Field>
          <Field label="Credit score"><Input type="number" {...form.register("borrower.creditScore")} /></Field>
          <Field label="Liquidity"><Input type="number" {...form.register("borrower.liquidity")} /></Field>
          <Field label="Net worth"><Input type="number" {...form.register("borrower.netWorth")} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loan request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Requested loan amount"><Input type="number" {...form.register("loanRequest.requestedLoanAmount")} /></Field>
          <Field label="Purchase price"><Input type="number" {...form.register("loanRequest.purchasePrice")} /></Field>
          <Field label="Property value (as-is/ARV)"><Input type="number" {...form.register("loanRequest.propertyValue")} /></Field>
          <Field label="NOI"><Input type="number" {...form.register("loanRequest.noi")} /></Field>
          <Field label="LTV (%)"><Input type="number" {...form.register("loanRequest.ltv")} /></Field>
          <Field label="LTC (%)"><Input type="number" {...form.register("loanRequest.ltc")} /></Field>
          <Field label="DSCR"><Input type="number" step="0.01" {...form.register("loanRequest.dscr")} /></Field>
          <Field label="Cap rate (%)"><Input type="number" step="0.01" {...form.register("loanRequest.capRate")} /></Field>

          <Field label="Loan purpose">
            <Select value={values.loanRequest.loanPurpose} onValueChange={(v) => form.setValue("loanRequest.loanPurpose", v as never)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOAN_PURPOSE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Property type">
            <Select value={values.loanRequest.propertyType} onValueChange={(v) => form.setValue("loanRequest.propertyType", v as never)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Occupancy">
            <Select value={values.loanRequest.occupancy ?? undefined} onValueChange={(v) => form.setValue("loanRequest.occupancy", v as never)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {OCCUPANCY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Recourse preference">
            <Select value={values.loanRequest.recoursePreference ?? undefined} onValueChange={(v) => form.setValue("loanRequest.recoursePreference", v as never)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="No preference" /></SelectTrigger>
              <SelectContent>
                {RECOURSE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Property address"><Input {...form.register("loanRequest.propertyAddress")} /></Field>
          <Field label="City"><Input {...form.register("loanRequest.propertyCity")} /></Field>
          <Field label="State">
            <Select value={values.loanRequest.propertyState} onValueChange={(v) => form.setValue("loanRequest.propertyState", v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Zip"><Input {...form.register("loanRequest.propertyZip")} /></Field>

          <Field label="Timeline (days to close)"><Input type="number" {...form.register("loanRequest.timelineDays")} /></Field>
          <Field label="Target closing date"><Input type="date" {...form.register("loanRequest.closingDate")} /></Field>
          <Field label="Exit strategy" full><Input {...form.register("loanRequest.exitStrategy")} /></Field>
          <Field label="Notes" full><Textarea rows={3} {...form.register("loanRequest.notes")} /></Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit loan request"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
