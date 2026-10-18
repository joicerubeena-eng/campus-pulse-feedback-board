import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, MessageSquareText, ShieldCheck, UserRound, EyeOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Voice — College Feedback Management System" },
      {
        name: "description",
        content:
          "Share feedback on teaching, facilities and support. Track responses and help your college improve.",
      },
      { property: "og:title", content: "Campus Voice — College Feedback Management System" },
      {
        property: "og:description",
        content: "Share feedback on teaching, facilities and support, and track every response.",
      },
    ],
  }),
  component: Index,
});

const features = [
  { icon: MessageSquareText, title: "Detailed feedback", text: "Rate teaching, facilities, support and your overall experience." },
  { icon: EyeOff, title: "Anonymous option", text: "Speak freely — hide your name and email with one switch." },
  { icon: BellRing, title: "Live updates", text: "Get notified the moment your feedback is reviewed or resolved." },
  { icon: BarChart3, title: "Insightful reports", text: "Admins see trends, charts, monthly reports and CSV exports." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Brand />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/admin-login">Admin</Link>
          </Button>
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:pt-20">
        <p className="mb-4 inline-block rounded-full border bg-accent px-3 py-1 text-xs font-medium uppercase tracking-wider text-accent-foreground">
          Student Feedback Management System
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
          Every voice on campus, <span className="text-primary">heard and answered.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Share honest feedback about classes, facilities and student support. Follow its progress
          from pending to resolved, and read the administration's reply.
        </p>
        <div className="mt-8 grid gap-3 sm:flex">
          <Button asChild size="lg">
            <Link to="/login">
              <UserRound className="mr-2 h-5 w-5" /> Student login
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/admin-login">
              <ShieldCheck className="mr-2 h-5 w-5" /> Admin login
            </Link>
          </Button>
        </div>
      </section>

      <section className="border-t bg-secondary/50">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5 shadow-sm">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Campus Voice Feedback Desk
      </footer>
    </div>
  );
}
