import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type FeedbackStatus } from "@/lib/feedback";

export function StarInput({
  value,
  onChange,
  label,
  error,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  error?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={label}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => onChange(n)}
              className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={cn(
                  "h-7 w-7",
                  n <= value ? "fill-star text-star" : "text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("h-4 w-4", n <= value ? "fill-star text-star" : "text-muted-foreground/30")}
        />
      ))}
    </span>
  );
}

const statusClass: Record<FeedbackStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground dark:text-warning border-warning/40",
  reviewed: "bg-info/15 text-info border-info/40",
  resolved: "bg-success/15 text-success border-success/40",
};

export function StatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusClass[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
