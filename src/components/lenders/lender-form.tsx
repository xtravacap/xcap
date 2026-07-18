"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { lenderSchema, type LenderInput } from "@/lib/validation/lender";
import { typedZodResolver } from "@/lib/form-resolver";
import { CAPABILITY_FLAGS, LOAN_TYPE_OPTIONS, PROPERTY_TYPE_OPTIONS, RECOURSE_OPTIONS, US_STATES } from "@/lib/constants";
import { MultiSelect } from "@/components/forms/multi-select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const STATE_OPTIONS = US_STATES.map((s) => ({ value: s, label: s }));

const DEFAULT_VALUES: LenderInput = {
  companyName: "",
  primaryContact: "",
  email: "",
  phone: "",
  website: "",
  logoUrl: "",
  loanTypes: [],
  propertyTypes: [],
  states: [],
  minLoanAmount: 500_000,
  maxLoanAmount: 5_000_000,
  maxLtc: 80,
  maxLtv: 75,
  minDscr: 1.2,
  minCreditScore: 660,
  recourse: "EITHER",
  interestRateMin: 8,
  interestRateMax: 12,
  originationFeeMin: 1,
  originationFeeMax: 2,
  allowsBridge: false,
  allowsDscr: false,
  allowsConstruction: false,
  allowsGroundUp: false,
  allowsFixFlip: false,
  allowsMultifamily: false,
  allowsMixedUse: false,
  allowsRetail: false,
  allowsOffice: false,
  allowsIndustrial: false,
  allowsSelfStorage: false,
  allowsHospitality: false,
  allowsLand: false,
  preferredMarkets: [],
  requiredExperienceYears: 2,
  sponsorNetWorthRequirement: 500_000,
  liquidityRequirement: 100_000,
  entityRequirements: "",
  prepaymentPenalty: "",
  closingTimelineDays: 30,
  notes: "",
  isActive: true,
};

export function LenderForm({ lenderId, defaultValues }: { lenderId?: string; defaultValues?: Partial<LenderInput> }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<LenderInput>({
    resolver: typedZodResolver(lenderSchema),
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
  });

  async function onSubmit(values: LenderInput) {
    setSubmitting(true);
    try {
      const res = await fetch(lenderId ? `/api/lenders/${lenderId}` : "/api/lenders", {
        method: lenderId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save lender");
      }
      const data = await res.json();
      toast.success(lenderId ? "Lender updated" : "Lender added");
      router.push(`/lenders/${data.lender.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const values = form.watch();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loan-box">Loan Box</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Company name</Label>
                <Input {...form.register("companyName")} />
              </div>
              <div className="space-y-1.5">
                <Label>Primary contact</Label>
                <Input {...form.register("primaryContact")} />
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
                <Label>Website</Label>
                <Input {...form.register("website")} placeholder="https://" />
              </div>
              <div className="flex items-center gap-2 self-end pb-2">
                <Switch checked={values.isActive} onCheckedChange={(v) => form.setValue("isActive", v)} />
                <Label>Active lender</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loan-box" className="mt-4">
          <Card>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Loan types</Label>
                <MultiSelect options={LOAN_TYPE_OPTIONS} value={values.loanTypes} onChange={(v) => form.setValue("loanTypes", v as never)} placeholder="Loan types" />
              </div>
              <div className="space-y-1.5">
                <Label>Property types</Label>
                <MultiSelect options={PROPERTY_TYPE_OPTIONS} value={values.propertyTypes} onChange={(v) => form.setValue("propertyTypes", v as never)} placeholder="Property types" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>States</Label>
                <MultiSelect options={STATE_OPTIONS} value={values.states} onChange={(v) => form.setValue("states", v as never)} placeholder="Licensed / active states" />
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
                <Label>Max LTC (%)</Label>
                <Input type="number" {...form.register("maxLtc")} />
              </div>
              <div className="space-y-1.5">
                <Label>Max LTV (%)</Label>
                <Input type="number" {...form.register("maxLtv")} />
              </div>
              <div className="space-y-1.5">
                <Label>Min DSCR</Label>
                <Input type="number" step="0.01" {...form.register("minDscr")} />
              </div>
              <div className="space-y-1.5">
                <Label>Min credit score</Label>
                <Input type="number" {...form.register("minCreditScore")} />
              </div>
              <div className="space-y-1.5">
                <Label>Recourse</Label>
                <Select value={values.recourse} onValueChange={(v) => form.setValue("recourse", v as never)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECOURSE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Interest rate range (%)</Label>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" {...form.register("interestRateMin")} placeholder="Min" />
                  <Input type="number" step="0.01" {...form.register("interestRateMax")} placeholder="Max" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Origination fee range (%)</Label>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" {...form.register("originationFeeMin")} placeholder="Min" />
                  <Input type="number" step="0.01" {...form.register("originationFeeMax")} placeholder="Max" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities" className="mt-4">
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {CAPABILITY_FLAGS.map((flag) => (
                  <label key={flag.key} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                    <Checkbox
                      checked={Boolean(values[flag.key as keyof LenderInput])}
                      onCheckedChange={(checked) => form.setValue(flag.key as keyof LenderInput, Boolean(checked) as never)}
                    />
                    {flag.label}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="mt-4">
          <Card>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Required sponsor experience (years)</Label>
                <Input type="number" {...form.register("requiredExperienceYears")} />
              </div>
              <div className="space-y-1.5">
                <Label>Closing timeline (days)</Label>
                <Input type="number" {...form.register("closingTimelineDays")} />
              </div>
              <div className="space-y-1.5">
                <Label>Sponsor net worth requirement</Label>
                <Input type="number" {...form.register("sponsorNetWorthRequirement")} />
              </div>
              <div className="space-y-1.5">
                <Label>Liquidity requirement</Label>
                <Input type="number" {...form.register("liquidityRequirement")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Preferred markets</Label>
                <Input
                  placeholder="Comma-separated, e.g. Northern NJ, NYC Metro, Philadelphia"
                  value={values.preferredMarkets.join(", ")}
                  onChange={(e) => form.setValue("preferredMarkets", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Entity requirements</Label>
                <Textarea {...form.register("entityRequirements")} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Prepayment penalty</Label>
                <Textarea {...form.register("prepaymentPenalty")} rows={2} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea {...form.register("notes")} rows={4} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : lenderId ? "Save changes" : "Add lender"}
        </Button>
      </div>
    </form>
  );
}
