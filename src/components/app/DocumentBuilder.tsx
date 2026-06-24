import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Calculator, UserPlus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { computeDocTotals, type LineInput } from "@/lib/gst";
import { useAuth } from "@/lib/auth";

type DocType = "quotation" | "proforma";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  docType: DocType;
  documentId?: string | null;
};

type Item = LineInput & {
  name: string;
  hsn_code: string;
  unit: string;
  description: string;
};

const emptyItem = (defaultTax = 18): Item => ({
  name: "",
  hsn_code: "",
  unit: "pcs",
  description: "",
  quantity: 1,
  rate: 0,
  discount_percent: 0,
  tax_percent: defaultTax,
});

export function DocumentBuilder({ open, onOpenChange, docType, documentId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isEdit = !!documentId;
  const [showNewClient, setShowNewClient] = useState(false);

  const { data: clients } = useQuery({
    queryKey: ["clients-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, company_name, state_code, gst_number")
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const { data: company } = useQuery({
    queryKey: ["company-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Load existing document when editing
  const { data: existing } = useQuery({
    queryKey: ["document-edit", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, document_items(*)")
        .eq("id", documentId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!documentId,
  });

  const defaultTax = Number(company?.default_gst_rate ?? 18);

  const [clientId, setClientId] = useState<string>("");
  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [validityDate, setValidityDate] = useState<string>("");
  const [reference, setReference] = useState("");
  const [gstMode, setGstMode] = useState<"exclusive" | "inclusive" | "none">("exclusive");
  const [gstKind, setGstKind] = useState<"intra" | "inter">("intra");
  const [items, setItems] = useState<Item[]>([emptyItem(defaultTax)]);
  const [extraDiscount, setExtraDiscount] = useState("0");
  const [shipping, setShipping] = useState("0");
  const [packaging, setPackaging] = useState("0");
  const [other, setOther] = useState("0");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  useEffect(() => {
    if (open) {
      if (isEdit && existing) {
        const ex = existing as Record<string, unknown> & {
          document_items?: Array<Record<string, unknown>>;
        };
        setClientId(String(ex.client_id ?? ""));
        setIssueDate(String(ex.issue_date ?? new Date().toISOString().slice(0, 10)));
        setValidityDate(ex.validity_date ? String(ex.validity_date) : "");
        setReference(ex.reference ? String(ex.reference) : "");
        setGstMode((ex.gst_mode as typeof gstMode) ?? "exclusive");
        setGstKind((ex.gst_kind as typeof gstKind) ?? "intra");
        setExtraDiscount(String(ex.discount_value ?? "0"));
        setShipping(String(ex.shipping_charge ?? "0"));
        setPackaging(String(ex.packaging_charge ?? "0"));
        setOther(String(ex.other_charge ?? "0"));
        setNotes(ex.notes ? String(ex.notes) : "");
        setTerms(ex.terms ? String(ex.terms) : "");
        const rows = (ex.document_items ?? [])
          .slice()
          .sort((a, b) => Number(a.position) - Number(b.position))
          .map((it) => ({
            name: String(it.name ?? ""),
            hsn_code: String(it.hsn_code ?? ""),
            unit: String(it.unit ?? "pcs"),
            description: String(it.description ?? ""),
            quantity: Number(it.quantity ?? 1),
            rate: Number(it.rate ?? 0),
            discount_percent: Number(it.discount_percent ?? 0),
            tax_percent: Number(it.tax_percent ?? defaultTax),
          })) as Item[];
        setItems(rows.length ? rows : [emptyItem(defaultTax)]);
      } else if (!isEdit) {
        setItems([emptyItem(defaultTax)]);
        setClientId("");
        setIssueDate(new Date().toISOString().slice(0, 10));
        setValidityDate("");
        setReference("");
        setGstMode("exclusive");
        setGstKind("intra");
        setExtraDiscount("0");
        setShipping("0");
        setPackaging("0");
        setOther("0");
        setNotes(company?.default_notes ?? "");
        setTerms(company?.default_terms ?? "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, company?.id, existing?.id, isEdit]);

  const totals = useMemo(
    () =>
      computeDocTotals(items, {
        gst_mode: gstMode,
        gst_kind: gstKind,
        extra_discount: Number(extraDiscount) || 0,
        shipping: Number(shipping) || 0,
        packaging: Number(packaging) || 0,
        other: Number(other) || 0,
      }),
    [items, gstMode, gstKind, extraDiscount, shipping, packaging, other],
  );

  const updateItem = (i: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const removeItem = (i: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!clientId) throw new Error("Select a client");
      if (items.some((i) => !i.name.trim())) throw new Error("Every line needs an item name");

      const payload = {
        client_id: clientId,
        issue_date: issueDate,
        validity_date: validityDate || null,
        reference: reference || null,
        currency: company?.default_currency ?? "INR",
        gst_mode: gstMode,
        gst_kind: gstKind,
        subtotal: totals.subtotal,
        discount_value: Number(extraDiscount) || 0,
        discount_amount: totals.discount_amount,
        taxable_amount: totals.taxable_amount,
        cgst_amount: totals.cgst_amount,
        sgst_amount: totals.sgst_amount,
        igst_amount: totals.igst_amount,
        shipping_charge: Number(shipping) || 0,
        packaging_charge: Number(packaging) || 0,
        other_charge: Number(other) || 0,
        grand_total: totals.grand_total,
        notes: notes || null,
        terms: terms || null,
      };

      let docId = documentId ?? "";
      let docNumber = "";

      if (isEdit && documentId) {
        const { data: upd, error: upErr } = await supabase
          .from("documents")
          .update(payload)
          .eq("id", documentId)
          .select("id, doc_number")
          .single();
        if (upErr) throw upErr;
        docId = upd.id;
        docNumber = upd.doc_number;
        const { error: delErr } = await supabase
          .from("document_items")
          .delete()
          .eq("document_id", documentId);
        if (delErr) throw delErr;
      } else {
        const year = new Date(issueDate).getFullYear();
        const prefix =
          docType === "quotation"
            ? company?.quotation_prefix ?? "QUO"
            : company?.invoice_prefix ?? "INV";
        const { data: numberData, error: numErr } = await supabase.rpc("next_document_number", {
          _doc_type: docType,
          _year: year,
          _prefix: prefix,
        });
        if (numErr) throw numErr;
        docNumber = numberData as string;
        const { data: doc, error: docErr } = await supabase
          .from("documents")
          .insert({
            ...payload,
            owner_id: user.id,
            company_id: company?.id ?? null,
            doc_type: docType,
            doc_number: docNumber,
            status: "draft",
          })
          .select("id")
          .single();
        if (docErr) throw docErr;
        docId = doc.id;
      }

      const itemRows = items.map((it, idx) => {
        const q = Number(it.quantity) || 0;
        const r = Number(it.rate) || 0;
        const dp = Number(it.discount_percent) || 0;
        const line_total = q * r * (1 - dp / 100);
        return {
          document_id: docId,
          owner_id: user.id,
          position: idx,
          name: it.name,
          description: it.description || null,
          hsn_code: it.hsn_code || null,
          quantity: q,
          unit: it.unit || "pcs",
          rate: r,
          discount_percent: dp,
          tax_percent: Number(it.tax_percent) || 0,
          line_total,
        };
      });
      const { error: itemsErr } = await supabase.from("document_items").insert(itemRows);
      if (itemsErr) throw itemsErr;

      return docNumber;
    },
    onSuccess: (num) => {
      toast.success(`${docType === "quotation" ? "Quotation" : "Invoice"} ${num} ${isEdit ? "updated" : "created"}`);
      qc.invalidateQueries({ queryKey: ["documents", docType] });
      qc.invalidateQueries({ queryKey: ["document-edit", documentId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const currency = company?.default_currency ?? "INR";
  const label = docType === "quotation" ? "Quotation" : "Proforma Invoice";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${label}` : `New ${label}`}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update details, items and totals. Changes are saved on click."
              : "Number is generated automatically when you save. GST is calculated live."}
          </DialogDescription>
        </DialogHeader>

        {!company && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-2 text-sm">
            Set up your company profile in Settings first so totals, branding and numbering work.
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Client *</Label>
              <button
                type="button"
                onClick={() => setShowNewClient(true)}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <UserPlus className="size-3" /> New client
              </button>
            </div>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {clients?.length ? clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}{c.company_name ? ` · ${c.company_name}` : ""}
                  </SelectItem>
                )) : <div className="px-3 py-2 text-xs text-muted-foreground">Add a client first</div>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Issue date</Label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{docType === "quotation" ? "Valid until" : "Due date"}</Label>
            <Input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Reference</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="PO #, RFQ..." />
          </div>
          <div className="space-y-1.5">
            <Label>GST mode</Label>
            <Select value={gstMode} onValueChange={(v) => setGstMode(v as typeof gstMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="exclusive">Tax exclusive</SelectItem>
                <SelectItem value="inclusive">Tax inclusive</SelectItem>
                <SelectItem value="none">No tax</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tax type</Label>
            <Select value={gstKind} onValueChange={(v) => setGstKind(v as typeof gstKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="intra">Intra-state (CGST + SGST)</SelectItem>
                <SelectItem value="inter">Inter-state (IGST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2 rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
            <div className="col-span-4">Item</div>
            <div className="col-span-1">HSN</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-1 text-right">Disc %</div>
            <div className="col-span-1 text-right">GST %</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1" />
          </div>
          {items.map((it, i) => {
            const q = Number(it.quantity) || 0;
            const r = Number(it.rate) || 0;
            const dp = Number(it.discount_percent) || 0;
            const lineTotal = q * r * (1 - dp / 100);
            return (
              <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-border items-start">
                <div className="col-span-4 space-y-1">
                  <Input
                    placeholder="Item name"
                    value={it.name}
                    onChange={(e) => updateItem(i, { name: e.target.value })}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={it.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <Input
                  className="col-span-1"
                  value={it.hsn_code}
                  onChange={(e) => updateItem(i, { hsn_code: e.target.value })}
                />
                <Input
                  className="col-span-1 text-right"
                  type="number"
                  min={0}
                  step="0.001"
                  value={it.quantity}
                  onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                />
                <Input
                  className="col-span-2 text-right"
                  type="number"
                  min={0}
                  step="0.01"
                  value={it.rate}
                  onChange={(e) => updateItem(i, { rate: Number(e.target.value) })}
                />
                <Input
                  className="col-span-1 text-right"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={it.discount_percent}
                  onChange={(e) => updateItem(i, { discount_percent: Number(e.target.value) })}
                />
                <Input
                  className="col-span-1 text-right"
                  type="number"
                  min={0}
                  max={28}
                  step="0.01"
                  value={it.tax_percent}
                  onChange={(e) => updateItem(i, { tax_percent: Number(e.target.value) })}
                />
                <div className="col-span-1 text-right text-sm tabular-nums pt-2">
                  {formatCurrency(lineTotal, currency)}
                </div>
                <div className="col-span-1 flex justify-end pt-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          <div className="px-3 py-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setItems((prev) => [...prev, emptyItem(defaultTax)])}
            >
              <Plus className="size-4" /> Add line
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-2">
          <div className="space-y-3">
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Terms &amp; conditions</Label>
              <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide font-medium">
              <Calculator className="size-3.5" /> Summary
            </div>
            <Row label="Subtotal" value={formatCurrency(totals.subtotal, currency)} />
            <Row label="Discount" value={`− ${formatCurrency(totals.discount_amount, currency)}`} />
            <Row label="Taxable" value={formatCurrency(totals.taxable_amount, currency)} />
            {gstKind === "intra" ? (
              <>
                <Row label="CGST" value={formatCurrency(totals.cgst_amount, currency)} />
                <Row label="SGST" value={formatCurrency(totals.sgst_amount, currency)} />
              </>
            ) : (
              <Row label="IGST" value={formatCurrency(totals.igst_amount, currency)} />
            )}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div>
                <Label className="text-xs">Extra disc.</Label>
                <Input type="number" value={extraDiscount} onChange={(e) => setExtraDiscount(e.target.value)} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Shipping</Label>
                <Input type="number" value={shipping} onChange={(e) => setShipping(e.target.value)} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Other</Label>
                <Input type="number" value={other} onChange={(e) => setOther(e.target.value)} className="h-8" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
              <span className="font-display text-base font-semibold">Grand total</span>
              <span className="font-display text-lg font-bold text-primary tabular-nums">
                {formatCurrency(totals.grand_total, currency)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="shadow-glow"
            onClick={() => save.mutate()}
            disabled={save.isPending || !clientId}
          >
            {save.isPending ? "Saving…" : isEdit ? `Update ${label}` : `Save ${label}`}
          </Button>
        </DialogFooter>
      </DialogContent>

      <NewClientDialog
        open={showNewClient}
        onOpenChange={setShowNewClient}
        onCreated={(id) => {
          setClientId(id);
          qc.invalidateQueries({ queryKey: ["clients-options"] });
          qc.invalidateQueries({ queryKey: ["clients"] });
        }}
      />
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function NewClientDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gst, setGst] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [addr, setAddr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(""); setCompanyName(""); setEmail(""); setPhone("");
      setGst(""); setState(""); setCity(""); setAddr("");
    }
  }, [open]);

  const submit = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const { data, error } = await supabase
      .from("clients")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        company_name: companyName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        gst_number: gst.trim() || null,
        state: state.trim() || null,
        city: city.trim() || null,
        address_line1: addr.trim() || null,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Client created");
    onCreated(data.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New client</DialogTitle>
          <DialogDescription>Add a client and use them immediately on this document.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact name" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Company</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>GSTIN</Label>
            <Input value={gst} onChange={(e) => setGst(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>State</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Address</Label>
            <Input value={addr} onChange={(e) => setAddr(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Create client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}