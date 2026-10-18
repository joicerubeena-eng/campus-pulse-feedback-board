import { useState } from "react";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { BarChart3, FileText, LayoutDashboard, LogOut, Menu, MessagesSquare, PenSquare } from "lucide-react";
import { fetchRole, useMe, useSignOut } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const role = await fetchRole(context.userId);
    if (role !== "admin") throw redirect({ to: "/submit" });
  },
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/feedback", label: "Feedback", icon: MessagesSquare, exact: false },
  { to: "/admin/reports", label: "Reports", icon: BarChart3, exact: false },
] as const;

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { data: me } = useMe();
  const signOut = useSignOut();
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-5">
        <Brand to="/admin" className="[&>span:first-child]:bg-sidebar-primary [&>span:first-child]:text-sidebar-primary-foreground" />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest opacity-50">Manage</p>
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            activeOptions={{ exact: n.exact }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium opacity-80 transition hover:bg-sidebar-accent hover:opacity-100"
            activeProps={{ className: "!bg-sidebar-accent !opacity-100 text-sidebar-primary" }}
          >
            <n.icon className="h-5 w-5" /> {n.label}
          </Link>
        ))}
        <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-widest opacity-50">Student view</p>
        <Link to="/submit" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium opacity-80 hover:bg-sidebar-accent hover:opacity-100">
          <PenSquare className="h-5 w-5" /> Feedback form
        </Link>
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-sidebar-accent text-sm font-semibold">
            {(me?.fullName || me?.email || "A").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{me?.fullName || "Administrator"}</p>
            <p className="truncate text-xs opacity-60">{me?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ThemeToggle className="hover:bg-sidebar-accent hover:text-sidebar-foreground" />
          <Button variant="ghost" className="flex-1 justify-start hover:bg-sidebar-accent hover:text-sidebar-foreground" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 print:hidden lg:block">
        <SidebarNav />
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur print:hidden lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="flex items-center gap-2 font-display font-semibold"><FileText className="h-4 w-4 text-primary" /> Admin</span>
        <ThemeToggle />
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
