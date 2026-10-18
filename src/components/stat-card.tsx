import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "destructive" | "info" | "star";
  hint?: string;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground dark:text-warning",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-info/15 text-info",
    star: "bg-star/20 text-star",
  };
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Panel({ title, children, className, action }: { title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-4 shadow-sm sm:p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export const chartTooltip = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--popover-foreground)",
    fontSize: 12,
  },
};
export const axisProps = { stroke: "var(--muted-foreground)", fontSize: 12, tickLine: false, axisLine: false };
