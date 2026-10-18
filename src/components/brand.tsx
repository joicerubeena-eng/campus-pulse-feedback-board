import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="h-5 w-5" />
      </span>
      <span className="font-display text-lg leading-none">
        Campus Voice
        <span className="block text-[10px] font-sans font-medium uppercase tracking-widest opacity-60">
          Feedback Desk
        </span>
      </span>
    </Link>
  );
}
