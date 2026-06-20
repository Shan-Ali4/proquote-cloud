import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/quotations")({
  head: () => ({
    meta: [
      { title: "Quotations — ProQuote Pro" },
      { name: "description", content: "Create, send and convert GST-ready quotations." },
    ],
  }),
  component: QuotationsPage,
});

function QuotationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Quotations</h1>
        <p className="text-muted-foreground mt-1 text-sm">Coming up next: full builder with line items, GST engine, PDF & Excel export.</p>
      </div>
      <div className="glass-card rounded-2xl p-12 text-center">
        <div className="size-12 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center mx-auto shadow-glow">
          <FileText className="size-6 text-primary-foreground" />
        </div>
        <h2 className="font-display text-xl font-semibold mt-4">Quotation builder lands in Phase 1.5</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Add your clients and company info first — they wire up automatically into every new quotation.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline"><Link to="/clients">Manage clients</Link></Button>
          <Button asChild className="shadow-glow"><Link to="/settings"><Sparkles className="size-4" /> Set up company</Link></Button>
        </div>
      </div>
    </div>
  );
}