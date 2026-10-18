import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ClipboardList, LayoutDashboard, LogOut, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMe, useSignOut } from "@/lib/auth";

const linkCls =
  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const activeCls = "bg-accent text-accent-foreground";

export function StudentShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const signOut = useSignOut();
  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <Brand to="/submit" />
          <nav className="hidden items-center gap-1 sm:flex">
            <Link to="/submit" className={linkCls} activeProps={{ className: activeCls }}>
              <PenSquare className="h-4 w-4" /> Give feedback
            </Link>
            <Link to="/my-feedback" className={linkCls} activeProps={{ className: activeCls }}>
              <ClipboardList className="h-4 w-4" /> My feedback
            </Link>
            {me?.role === "admin" && (
              <Link to="/admin" className={linkCls}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-1">
            <span className="hidden max-w-[160px] truncate text-sm text-muted-foreground md:inline">
              {me?.fullName || me?.email}
            </span>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t bg-background sm:hidden">
        <Link to="/submit" className="flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }}>
          <PenSquare className="h-5 w-5" /> Give feedback
        </Link>
        <Link to="/my-feedback" className="flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground" activeProps={{ className: "text-primary" }}>
          <ClipboardList className="h-5 w-5" /> My feedback
        </Link>
      </nav>
    </div>
  );
}
