import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Building2 } from "lucide-react";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/clients")({
  head: () => ({
    meta: [
      { title: "Clients — ProQuote Pro" },
      { name: "description", content: "Manage clients, GST/PAN, contact details, and payment terms." },
    ],
  }),
  component: ClientsPage,
});

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  company_name: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  gst_number: z.string().trim().max(20).optional().or(z.literal("")),
  pan_number: z.string().trim().max(20).optional().or(z.literal("")),
  address_line1: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  pincode: z.string().trim().max(20).optional().or(z.literal("")),
  payment_terms: z.string().trim().max(120).optional().or(z.literal("")),
  credit_limit: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
type ClientValues = z.infer<typeof clientSchema>;

type ClientRow = {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  gst_number: string | null;
  pan_number: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  payment_terms: string | null;
  credit_limit: number | null;
  created_at: string;
};

function ClientsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ClientRow | null>(null);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<ClientRow[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("id,name,company_name,email,phone,gst_number,pan_number,city,state,country,payment_terms,credit_limit,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!clients) return [];
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) =>
      [c.name, c.company_name, c.email, c.phone, c.gst_number, c.city]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [clients, search]);

  const form = useForm<ClientValues>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: { country: "India" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ country: "India" });
    setDialogOpen(true);
  }
  function openEdit(c: ClientRow) {
    setEditing(c);
    form.reset({
      name: c.name,
      company_name: c.company_name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      gst_number: c.gst_number ?? "",
      pan_number: c.pan_number ?? "",
      city: c.city ?? "",
      state: c.state ?? "",
      country: c.country ?? "India",
      payment_terms: c.payment_terms ?? "",
      credit_limit: c.credit_limit != null ? String(c.credit_limit) : "",
      notes: "",
      address_line1: "",
      pincode: "",
    });
    setDialogOpen(true);
  }

  const upsert = useMutation({
    mutationFn: async (values: ClientValues) => {
      if (!user) throw new Error("Not authenticated");
      const creditNum = values.credit_limit && values.credit_limit !== ""
        ? Number(values.credit_limit)
        : null;
      const payload = {
        owner_id: user.id,
        name: values.name,
        company_name: values.company_name || null,
        email: values.email || null,
        phone: values.phone || null,
        gst_number: values.gst_number || null,
        pan_number: values.pan_number || null,
        address_line1: values.address_line1 || null,
        city: values.city || null,
        state: values.state || null,
        country: values.country || null,
        pincode: values.pincode || null,
        payment_terms: values.payment_terms || null,
        credit_limit: Number.isFinite(creditNum as number) ? creditNum : null,
        notes: values.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Client updated" : "Client created");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setDialogOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Client deleted");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your complete client directory with GST & contact details
          </p>
        </div>
        <Button className="shadow-glow" onClick={openCreate}>
          <Plus className="size-4" /> Add Client
        </Button>
      </div>

      <div className="glass-card rounded-2xl">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, GST…"
              className="pl-9"
            />
          </div>
          <div className="ml-auto text-xs text-muted-foreground">{filtered.length} client{filtered.length === 1 ? "" : "s"}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-6 py-3">Client</th>
                <th className="text-left font-medium px-6 py-3">Contact</th>
                <th className="text-left font-medium px-6 py-3">GSTIN</th>
                <th className="text-left font-medium px-6 py-3">Location</th>
                <th className="text-left font-medium px-6 py-3">Terms</th>
                <th className="text-right font-medium px-6 py-3 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="px-6 py-6"><Skeleton className="h-8 w-full" /></td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Building2 className="size-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {search ? "No clients match your search." : "No clients yet. Add your first client to get started."}
                    </p>
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border/60 hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium">{c.name}</div>
                    {c.company_name && <div className="text-xs text-muted-foreground">{c.company_name}</div>}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {c.email && <div>{c.email}</div>}
                    {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs">{c.gst_number ?? "—"}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">
                    {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{c.payment_terms ?? "—"}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(c)} aria-label="Delete">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit client" : "New client"}</DialogTitle>
            <DialogDescription>
              Client details appear on every quotation and proforma invoice.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => upsert.mutate(v))} className="grid sm:grid-cols-2 gap-4">
            <Field label="Contact name *" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} placeholder="Ada Lovelace" />
            </Field>
            <Field label="Company name">
              <Input {...form.register("company_name")} placeholder="Acme Pvt Ltd" />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </Field>
            <Field label="Phone">
              <Input {...form.register("phone")} />
            </Field>
            <Field label="GSTIN">
              <Input {...form.register("gst_number")} placeholder="29ABCDE1234F1Z5" className="font-mono" />
            </Field>
            <Field label="PAN">
              <Input {...form.register("pan_number")} placeholder="ABCDE1234F" className="font-mono" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Input {...form.register("address_line1")} />
            </Field>
            <Field label="City"><Input {...form.register("city")} /></Field>
            <Field label="State"><Input {...form.register("state")} /></Field>
            <Field label="Country"><Input {...form.register("country")} /></Field>
            <Field label="Pincode"><Input {...form.register("pincode")} /></Field>
            <Field label="Payment terms">
              <Input {...form.register("payment_terms")} placeholder="Net 30" />
            </Field>
            <Field label="Credit limit (₹)">
        <Input type="number" step="0.01" inputMode="decimal" {...form.register("credit_limit")} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea {...form.register("notes")} rows={3} />
            </Field>
            <DialogFooter className="sm:col-span-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={upsert.isPending}>
                {upsert.isPending ? "Saving…" : editing ? "Save changes" : "Create client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will not delete documents already issued to {confirmDelete?.name}, but the client link will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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