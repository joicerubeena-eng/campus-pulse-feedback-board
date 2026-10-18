import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  fullName: z.string().trim().max(100),
});

export function AuthCard({ kind }: { kind: "student" | "admin" }) {
  const isAdmin = kind === "admin";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("");
    const parsed = schema.safeParse(form);
    const errs: Record<string, string> = {};
    if (!parsed.success) parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
    if (mode === "signup" && !form.fullName.trim()) errs.fullName = "Enter your full name";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}${isAdmin ? "/admin-login" : "/login"}`,
            data: { full_name: form.fullName.trim(), requested_role: kind },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice("Account created! Check your email and click the confirmation link, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getUser();
      const role = data.user ? await fetchRole(data.user.id) : "student";
      await queryClient.invalidateQueries();
      if (isAdmin && role !== "admin") {
        await supabase.auth.signOut();
        toast.error("This account doesn't have admin access. Use the student login instead.");
        return;
      }
      toast.success(`Welcome${role === "admin" ? ", admin" : ""}!`);
      navigate({ to: role === "admin" ? "/admin" : "/submit" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = "text", auto?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type={type}
        autoComplete={auto}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        aria-invalid={!!errors[key]}
      />
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Brand />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-primary">
              {isAdmin ? <ShieldCheck className="h-6 w-6" /> : <UserRound className="h-6 w-6" />}
            </span>
            <div>
              <h1 className="text-2xl font-bold">{isAdmin ? "Admin portal" : "Student portal"}</h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "Manage and respond to feedback" : "Submit and track your feedback"}
              </p>
            </div>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="mb-5">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
          </Tabs>

          {notice && (
            <div className="mb-4 rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
              {notice}
            </div>
          )}
          {isAdmin && mode === "signup" && (
            <p className="mb-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              Only the first admin account created here gets admin access. Any later sign-ups become
              student accounts.
            </p>
          )}

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === "signup" && field("fullName", "Full name", "text", "name")}
            {field("email", "Email", "email", "email")}
            {field("password", "Password", "password", mode === "signup" ? "new-password" : "current-password")}
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isAdmin ? "Are you a student? " : "Are you an administrator? "}
            <Link to={isAdmin ? "/login" : "/admin-login"} className="font-medium text-primary underline-offset-4 hover:underline">
              {isAdmin ? "Student login" : "Admin login"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
