import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, FileText, Receipt, BarChart3, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProQuote Pro — Quotation & Proforma Invoice Management" },
      { name: "description", content: "India-first GST quotation and proforma invoice platform. Branded PDFs, Excel exports, UPI QR, multi-currency, and a real-time revenue dashboard." },
      { property: "og:title", content: "ProQuote Pro" },
      { property: "og:description", content: "Premium quotation & proforma invoice management with GST, PDFs, and analytics." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden gradient-mesh-bg">
      {/* Nav */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center shadow-glow">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <div className="font-display font-bold text-lg tracking-tight">ProQuote Pro</div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
          <Button asChild className="shadow-glow"><Link to="/auth">Get started</Link></Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass-card px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
          <span className="size-1.5 rounded-full bg-success" /> Built for Indian GST · CGST · SGST · IGST
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto bg-clip-text text-transparent bg-[image:linear-gradient(180deg,var(--foreground)_0%,color-mix(in_oklab,var(--foreground)_60%,transparent)_100%)]">
          Premium quotations &amp; proforma invoices, ready in seconds.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          ProQuote Pro generates branded, GST-perfect PDFs and editable Excel exports — with a real-time revenue dashboard, multi-currency support, and UPI QR payments.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="shadow-glow">
            <Link to="/auth">Start free <ArrowRight className="size-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">See the dashboard</Link>
          </Button>
        </div>

        {/* Feature grid */}
        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {[
            { icon: FileText, title: "Branded PDFs", body: "Pixel-perfect layouts with logo, signature, QR & terms." },
            { icon: Receipt, title: "GST Engine", body: "CGST/SGST/IGST, inclusive or exclusive, HSN/SAC ready." },
            { icon: BarChart3, title: "Live Analytics", body: "Revenue, conversion, GST collected, outstanding." },
            { icon: ShieldCheck, title: "Secure by default", body: "Row-level security, audit log, role-based access." },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-5">
              <div className="size-10 rounded-lg bg-accent grid place-items-center mb-3">
                <f.icon className="size-5 text-accent-foreground" />
              </div>
              <div className="font-display font-semibold">{f.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{f.body}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
