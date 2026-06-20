import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FileText,
  Receipt,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Percent,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";

import { StatCard } from "@/components/app/StatCard";
import { fetchDashboardStats } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ProQuote Pro" },
      { name: "description", content: "Executive view of revenue, GST collected, conversions, and outstanding amounts." },
    ],
  }),
  component: Dashboard,
});

const STATUS_TONE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-info/15 text-info border-info/20",
  approved: "bg-success/15 text-success border-success/20",
  rejected: "bg-destructive/15 text-destructive border-destructive/20",
  expired: "bg-warning/15 text-warning border-warning/20",
  paid: "bg-success/20 text-success border-success/30",
  partially_paid: "bg-warning/15 text-warning border-warning/20",
};

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardStats,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Executive snapshot of your billing activity
          </p>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard label="Total Revenue" value={formatCurrency(data?.totalRevenue ?? 0)} icon={TrendingUp} accent="primary" />
            <StatCard label="This Month" value={formatCurrency(data?.thisMonthRevenue ?? 0)} icon={CalendarClock} accent="info" />
            <StatCard label="Paid Amount" value={formatCurrency(data?.paidAmount ?? 0)} icon={CheckCircle2} accent="success" />
            <StatCard label="Pending Amount" value={formatCurrency(data?.pendingAmount ?? 0)} icon={Wallet} accent="warning" />
            <StatCard label="GST Collected" value={formatCurrency(data?.gstCollected ?? 0)} icon={Percent} accent="info" />
            <StatCard label="Overdue" value={formatCurrency(data?.overdueAmount ?? 0)} icon={AlertTriangle} accent="danger" />
            <StatCard label="Quotations" value={String(data?.totalQuotations ?? 0)} icon={FileText} accent="primary" />
            <StatCard label="Proforma Invoices" value={String(data?.totalInvoices ?? 0)} icon={Receipt} accent="success" />
          </>
        )}
      </div>

      {/* Chart + recent */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Revenue trend</h2>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthly ?? []} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                  }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fill="url(#rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="gst" stroke="var(--color-success)" fill="url(#gst)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Quick stats</h2>
          <dl className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Avg quotation</dt>
              <dd className="font-semibold">
                {formatCurrency(
                  data && data.totalQuotations
                    ? data.totalRevenue / (data.totalQuotations + data.totalInvoices)
                    : 0,
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Conversion rate</dt>
              <dd className="font-semibold">
                {data && (data.totalQuotations + data.totalInvoices) > 0
                  ? Math.round((data.totalInvoices / (data.totalQuotations + data.totalInvoices)) * 100)
                  : 0}
                %
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Outstanding</dt>
              <dd className="font-semibold text-warning">
                {formatCurrency(data?.overdueAmount ?? 0)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass-card rounded-2xl">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-6 py-3">Document</th>
                <th className="text-left font-medium px-6 py-3">Client</th>
                <th className="text-left font-medium px-6 py-3">Type</th>
                <th className="text-left font-medium px-6 py-3">Status</th>
                <th className="text-right font-medium px-6 py-3">Amount</th>
                <th className="text-right font-medium px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && (data?.recent.length ?? 0) === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No documents yet. Create your first quotation to see it here.
                </td></tr>
              )}
              {data?.recent.map((d) => (
                <tr key={d.id} className="border-t border-border/60 hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs">{d.doc_number}</td>
                  <td className="px-6 py-3">{d.client_name ?? "—"}</td>
                  <td className="px-6 py-3 capitalize text-muted-foreground">{d.doc_type === "proforma" ? "Proforma" : "Quotation"}</td>
                  <td className="px-6 py-3">
                    <Badge variant="outline" className={STATUS_TONE[d.status] ?? ""}>
                      {d.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-right font-medium">{formatCurrency(d.grand_total, d.currency)}</td>
                  <td className="px-6 py-3 text-right text-muted-foreground">{formatDate(d.issue_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}