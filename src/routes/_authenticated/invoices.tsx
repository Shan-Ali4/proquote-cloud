import { createFileRoute, Link } from "@tanstack/react-router";
import { Receipt, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/invoices")({
  head: () => ({
    meta: [
      { title: "Proforma Invoices — ProQuote Pro" },
      { name: "description", content: "Issue branded proforma invoices with GST, payments and PDF export." },
    ],
  }),
  component: InvoicesPage,
});

function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Proforma Invoices</h1>
        <p className="text-muted-foreground mt-1 text-sm">Coming up next: full proforma invoice builder with payments tracking.</p>
      </div>
      <div className="glass-card rounded-2xl p-12 text-center">
        <div className="size-12 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center mx-auto shadow-glow">
          <Receipt className="size-6 text-primary-foreground" />
        </div>
        <h2 className="font-display text-xl font-semibold mt-4">Invoice builder lands in Phase 1.5</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Set up your company profile and add clients now to be ready.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline"><Link to="/clients">Manage clients</Link></Button>
          <Button asChild className="shadow-glow"><Link to="/settings"><Sparkles className="size-4" /> Set up company</Link></Button>
        </div>
      </div>
    </div>
  );
}