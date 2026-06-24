import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Trash2, FileText, FileDown, FileSpreadsheet, MoreHorizontal, Pencil } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { formatCurrency, formatDate } from "@/lib/format";
import { DocumentBuilder } from "./DocumentBuilder";
import { exportDocumentPdf, exportDocumentExcel } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DocType = "quotation" | "proforma";

type Row = {
  id: string;
  doc_number: string;
  status: string;
  issue_date: string;
  validity_date: string | null;
  grand_total: number;
  currency: string;
  clients: { name: string; company_name: string | null } | null;
};

const statusTone: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  expired: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  partially_paid: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
};

export function DocumentsList({ docType }: { docType: DocType }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["documents", docType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, doc_number, status, issue_date, validity_date, grand_total, currency, clients(name, company_name)"
        )
        .eq("doc_type", docType)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return data ?? [];
    const q = search.toLowerCase();
    return (data ?? []).filter(
      (d) =>
        d.doc_number.toLowerCase().includes(q) ||
        d.clients?.name?.toLowerCase().includes(q) ||
        d.clients?.company_name?.toLowerCase().includes(q),
    );
  }, [data, search]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["documents", docType] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleExport = async (id: string, kind: "pdf" | "xlsx") => {
    try {
      if (kind === "pdf") await exportDocumentPdf(id);
      else await exportDocumentExcel(id);
      toast.success(`Exported ${kind.toUpperCase()}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const label = docType === "quotation" ? "Quotation" : "Proforma Invoice";
  const labelPlural = docType === "quotation" ? "Quotations" : "Proforma Invoices";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{labelPlural}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create, manage and track {labelPlural.toLowerCase()} with live GST.
          </p>
        </div>
        <Button className="shadow-glow" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New {label}
        </Button>
      </div>

      <div className="glass-card rounded-2xl">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${labelPlural.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="size-12 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center mx-auto shadow-glow">
              <FileText className="size-6 text-primary-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold mt-4">No {labelPlural.toLowerCase()} yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Click <strong>New {label}</strong> to create your first one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Number</th>
                  <th className="text-left px-4 py-3 font-medium">Client</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">
                    {docType === "quotation" ? "Valid until" : "Due"}
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{d.doc_number}</td>
                    <td className="px-4 py-3">
                      {d.clients?.name ?? "—"}
                      {d.clients?.company_name && (
                        <span className="text-muted-foreground"> · {d.clients.company_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatDate(d.issue_date)}</td>
                    <td className="px-4 py-3">{formatDate(d.validity_date)}</td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusTone[d.status] ?? statusTone.draft} border-0 capitalize`}>
                        {d.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatCurrency(Number(d.grand_total), d.currency)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Download PDF"
                          onClick={() => handleExport(d.id, "pdf")}
                        >
                          <FileDown className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit"
                          onClick={() => setEditId(d.id)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditId(d.id)}>
                              <Pencil className="size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(d.id, "pdf")}>
                              <FileDown className="size-4" /> Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(d.id, "xlsx")}>
                              <FileSpreadsheet className="size-4" /> Download Excel
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setToDelete(d)}
                            >
                              <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DocumentBuilder open={open} onOpenChange={setOpen} docType={docType} />
      <DocumentBuilder
        open={!!editId}
        onOpenChange={(o) => !o && setEditId(null)}
        docType={docType}
        documentId={editId}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.doc_number}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && del.mutate(toDelete.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}