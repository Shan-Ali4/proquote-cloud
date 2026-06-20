import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/quotations", label: "Quotations", icon: FileText },
  { to: "/invoices", label: "Proforma Invoices", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex h-screen sticky top-0 w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="size-9 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center shadow-glow">
          <Sparkles className="size-5 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="font-display font-bold text-base tracking-tight">ProQuote Pro</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Quotes · GST · PDFs</div>
        </div>
      </div>

      <nav className="px-3 py-2 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className={cn("size-4 transition-transform", active && "scale-110")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <div className="rounded-xl border border-sidebar-border bg-[image:var(--gradient-primary)] p-4 text-primary-foreground shadow-glow">
          <div className="text-xs uppercase tracking-widest opacity-80">Phase 1</div>
          <div className="font-display font-bold text-lg leading-tight mt-1">India-first GST billing</div>
          <div className="text-xs opacity-80 mt-1">CGST · SGST · IGST · HSN · UPI QR</div>
        </div>
      </div>
    </aside>
  );
}