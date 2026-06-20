import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — ProQuote Pro" },
      { name: "description", content: "Revenue, GST, client and outstanding reports." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">Revenue, GST, conversion, outstanding — exportable to PDF & Excel.</p>
      </div>
      <div className="glass-card rounded-2xl p-12 text-center">
        <BarChart3 className="size-10 mx-auto text-muted-foreground/60" />
        <p className="mt-4 text-sm text-muted-foreground">Reports module unlocks once you have documents to analyse.</p>
      </div>
    </div>
  );
}