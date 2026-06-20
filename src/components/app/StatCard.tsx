import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "danger" | "info";
};

const ACCENT: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "from-primary/20 to-primary/0 text-primary",
  success: "from-success/20 to-success/0 text-success",
  warning: "from-warning/20 to-warning/0 text-warning",
  danger: "from-destructive/20 to-destructive/0 text-destructive",
  info: "from-info/20 to-info/0 text-info",
};

export function StatCard({ label, value, delta, trend = "neutral", icon: Icon, accent = "primary" }: StatCardProps) {
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden group transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <div className={cn("absolute -top-10 -right-10 size-40 rounded-full bg-gradient-to-br blur-2xl opacity-60", ACCENT[accent])} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-3xl font-bold tracking-tight mt-2">{value}</div>
          {delta && (
            <div className={cn(
              "mt-2 text-xs font-medium",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-muted-foreground",
            )}>
              {delta}
            </div>
          )}
        </div>
        <div className={cn("size-10 rounded-xl grid place-items-center bg-gradient-to-br", ACCENT[accent])}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}