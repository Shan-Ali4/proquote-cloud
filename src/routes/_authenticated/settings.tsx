import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ProQuote Pro" },
      { name: "description", content: "Company profile, bank details, GST defaults, and document numbering." },
    ],
  }),
  component: SettingsPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(160),
  legal_name: z.string().trim().max(200).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  gst_number: z.string().trim().max(20).optional().or(z.literal("")),
  pan_number: z.string().trim().max(20).optional().or(z.literal("")),
  address_line1: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  pincode: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  bank_name: z.string().trim().max(120).optional().or(z.literal("")),
  bank_account: z.string().trim().max(40).optional().or(z.literal("")),
  bank_ifsc: z.string().trim().max(20).optional().or(z.literal("")),
  upi_id: z.string().trim().max(80).optional().or(z.literal("")),
  default_currency: z.string().max(3).default("INR"),
  default_gst_rate: z.coerce.number().min(0).max(50).default(18),
  quotation_prefix: z.string().trim().min(1).max(10).default("QUO"),
  invoice_prefix: z.string().trim().min(1).max(10).default("INV"),
  default_terms: z.string().trim().max(2000).optional().or(z.literal("")),
  default_notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
type Values = z.infer<typeof schema>;

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      default_currency: "INR",
      default_gst_rate: 18,
      quotation_prefix: "QUO",
      invoice_prefix: "INV",
      country: "India",
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name ?? "",
        legal_name: company.legal_name ?? "",
        email: company.email ?? "",
        phone: company.phone ?? "",
        website: company.website ?? "",
        gst_number: company.gst_number ?? "",
        pan_number: company.pan_number ?? "",
        address_line1: company.address_line1 ?? "",
        city: company.city ?? "",
        state: company.state ?? "",
        pincode: company.pincode ?? "",
        country: company.country ?? "India",
        bank_name: company.bank_name ?? "",
        bank_account: company.bank_account ?? "",
        bank_ifsc: company.bank_ifsc ?? "",
        upi_id: company.upi_id ?? "",
        default_currency: company.default_currency ?? "INR",
        default_gst_rate: Number(company.default_gst_rate ?? 18),
        quotation_prefix: company.quotation_prefix ?? "QUO",
        invoice_prefix: company.invoice_prefix ?? "INV",
        default_terms: company.default_terms ?? "",
        default_notes: company.default_notes ?? "",
      });
    }
  }, [company, form]);

  const save = useMutation({
    mutationFn: async (v: Values) => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        owner_id: user.id,
        name: v.name,
        legal_name: v.legal_name || null,
        email: v.email || null,
        phone: v.phone || null,
        website: v.website || null,
        gst_number: v.gst_number || null,
        pan_number: v.pan_number || null,
        address_line1: v.address_line1 || null,
        city: v.city || null,
        state: v.state || null,
        pincode: v.pincode || null,
        country: v.country || "India",
        bank_name: v.bank_name || null,
        bank_account: v.bank_account || null,
        bank_ifsc: v.bank_ifsc || null,
        upi_id: v.upi_id || null,
        default_currency: v.default_currency || "INR",
        default_gst_rate: v.default_gst_rate,
        quotation_prefix: v.quotation_prefix || "QUO",
        invoice_prefix: v.invoice_prefix || "INV",
        default_terms: v.default_terms || null,
        default_notes: v.default_notes || null,
      };
      if (company) {
        const { error } = await supabase.from("companies").update(payload).eq("id", company.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("companies").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Company profile saved");
      qc.invalidateQueries({ queryKey: ["company"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full rounded-2xl" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Company settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          These details appear on every quotation, proforma invoice and PDF export.
        </p>
      </div>

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-6">
        <Section title="Company">
          <Field label="Company name *" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} placeholder="Acme Pvt Ltd" />
          </Field>
          <Field label="Legal name"><Input {...form.register("legal_name")} /></Field>
          <Field label="Email"><Input type="email" {...form.register("email")} /></Field>
          <Field label="Phone"><Input {...form.register("phone")} /></Field>
          <Field label="Website"><Input {...form.register("website")} placeholder="https://" /></Field>
          <Field label="GSTIN"><Input className="font-mono" {...form.register("gst_number")} /></Field>
          <Field label="PAN"><Input className="font-mono" {...form.register("pan_number")} /></Field>
        </Section>

        <Section title="Address">
          <Field label="Address" className="sm:col-span-2"><Input {...form.register("address_line1")} /></Field>
          <Field label="City"><Input {...form.register("city")} /></Field>
          <Field label="State"><Input {...form.register("state")} /></Field>
          <Field label="Pincode"><Input {...form.register("pincode")} /></Field>
          <Field label="Country"><Input {...form.register("country")} /></Field>
        </Section>

        <Section title="Bank & UPI">
          <Field label="Bank name"><Input {...form.register("bank_name")} /></Field>
          <Field label="Account number"><Input className="font-mono" {...form.register("bank_account")} /></Field>
          <Field label="IFSC"><Input className="font-mono" {...form.register("bank_ifsc")} /></Field>
          <Field label="UPI ID"><Input className="font-mono" {...form.register("upi_id")} placeholder="company@upi" /></Field>
        </Section>

        <Section title="Document defaults">
          <Field label="Default currency"><Input {...form.register("default_currency")} /></Field>
          <Field label="Default GST rate (%)"><Input type="number" step="0.01" {...form.register("default_gst_rate")} /></Field>
          <Field label="Quotation prefix"><Input {...form.register("quotation_prefix")} /></Field>
          <Field label="Invoice prefix"><Input {...form.register("invoice_prefix")} /></Field>
          <Field label="Default terms & conditions" className="sm:col-span-2">
            <Textarea {...form.register("default_terms")} rows={3} />
          </Field>
          <Field label="Default notes" className="sm:col-span-2">
            <Textarea {...form.register("default_notes")} rows={2} />
          </Field>
        </Section>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={save.isPending} className="shadow-glow">
            {save.isPending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="font-display text-lg font-semibold mb-4">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}