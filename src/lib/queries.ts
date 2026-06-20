import { supabase } from "@/integrations/supabase/client";

export type DashboardStats = {
  totalQuotations: number;
  totalInvoices: number;
  totalRevenue: number;
  pendingAmount: number;
  paidAmount: number;
  gstCollected: number;
  thisMonthRevenue: number;
  overdueAmount: number;
  monthly: { month: string; revenue: number; gst: number }[];
  recent: RecentDoc[];
};

export type RecentDoc = {
  id: string;
  doc_number: string;
  doc_type: "quotation" | "proforma";
  status: string;
  grand_total: number;
  issue_date: string;
  client_name: string | null;
  currency: string;
};

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data: docsData, error } = await supabase
    .from("documents")
    .select(
      "id, doc_number, doc_type, status, grand_total, amount_paid, cgst_amount, sgst_amount, igst_amount, issue_date, currency, client_id, clients(name)"
    )
    .order("issue_date", { ascending: false });

  if (error) throw error;
  const docs = (docsData ?? []) as Array<{
    id: string;
    doc_number: string;
    doc_type: "quotation" | "proforma";
    status: string;
    grand_total: number | string;
    amount_paid: number | string;
    cgst_amount: number | string;
    sgst_amount: number | string;
    igst_amount: number | string;
    issue_date: string;
    currency: string;
    client_id: string | null;
    clients: { name: string } | null;
  }>;

  const n = (v: unknown) => Number(v ?? 0);

  const totalQuotations = docs.filter((d) => d.doc_type === "quotation").length;
  const totalInvoices = docs.filter((d) => d.doc_type === "proforma").length;
  const totalRevenue = docs.reduce((s, d) => s + n(d.grand_total), 0);
  const paidAmount = docs.reduce((s, d) => s + n(d.amount_paid), 0);
  const pendingAmount = totalRevenue - paidAmount;
  const gstCollected = docs.reduce(
    (s, d) => s + n(d.cgst_amount) + n(d.sgst_amount) + n(d.igst_amount),
    0,
  );

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const thisMonthRevenue = docs
    .filter((d) => {
      const dt = new Date(d.issue_date);
      return dt.getMonth() === thisMonth && dt.getFullYear() === thisYear;
    })
    .reduce((s, d) => s + n(d.grand_total), 0);

  const overdueAmount = docs
    .filter((d) => ["sent", "partially_paid", "expired"].includes(d.status))
    .reduce((s, d) => s + (n(d.grand_total) - n(d.amount_paid)), 0);

  // last 6 months
  const monthly: { month: string; revenue: number; gst: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(thisYear, thisMonth - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = d.toLocaleDateString("en-IN", { month: "short" });
    const monthDocs = docs.filter((doc) => {
      const dt = new Date(doc.issue_date);
      return dt.getMonth() === m && dt.getFullYear() === y;
    });
    monthly.push({
      month: label,
      revenue: monthDocs.reduce((s, d) => s + n(d.grand_total), 0),
      gst: monthDocs.reduce(
        (s, d) => s + n(d.cgst_amount) + n(d.sgst_amount) + n(d.igst_amount),
        0,
      ),
    });
  }

  const recent: RecentDoc[] = docs.slice(0, 8).map((d) => ({
    id: d.id,
    doc_number: d.doc_number,
    doc_type: d.doc_type,
    status: d.status,
    grand_total: n(d.grand_total),
    issue_date: d.issue_date,
    client_name: d.clients?.name ?? null,
    currency: d.currency,
  }));

  return {
    totalQuotations,
    totalInvoices,
    totalRevenue,
    pendingAmount,
    paidAmount,
    gstCollected,
    thisMonthRevenue,
    overdueAmount,
    monthly,
    recent,
  };
}