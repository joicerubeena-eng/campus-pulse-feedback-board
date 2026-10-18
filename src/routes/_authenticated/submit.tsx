import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, EyeOff, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { feedbackSchema, MESSAGE_MAX, TOPICS, type FeedbackInput } from "@/lib/feedback";
import { StudentShell } from "@/components/student-shell";
import { StarInput } from "@/components/feedback-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/submit")({
  head: () => ({
    meta: [
      { title: "Give Feedback — Campus Voice" },
      { name: "description", content: "Share your feedback about teaching, facilities and support." },
      { property: "og:title", content: "Give Feedback — Campus Voice" },
      { property: "og:description", content: "Share your feedback with the college." },
    ],
  }),
  component: SubmitPage,
});

type FormState = Omit<FeedbackInput, "topic"> & { topic: string };

const empty: FormState = {
  is_anonymous: false,
  name: "",
  email: "",
  topic: "",
  rating: 0,
  teaching_rating: 0,
  facilities_rating: 0,
  support_rating: 0,
  overall_rating: 0,
  message: "",
};

function SubmitPage() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (me) setForm((f) => ({ ...f, name: f.name || me.fullName, email: f.email || me.email }));
  }, [me]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = feedbackSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Partial<Record<keyof FormState, string>> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as keyof FormState] ??= i.message));
      setErrors(errs);
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (!me) return;
    setBusy(true);
    const v = parsed.data;
    const { error } = await supabase.from("feedback").insert({
      ...v,
      user_id: me.id,
      name: v.is_anonymous ? null : v.name,
      email: v.is_anonymous ? null : v.email,
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't submit feedback", { description: error.message });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["feedback"] });
    toast.success("Feedback submitted successfully!");
    setDone(true);
  };

  if (done) {
    return (
      <StudentShell>
        <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
          <h1 className="mt-4 text-3xl font-bold">Thank you!</h1>
          <p className="mt-2 text-muted-foreground">
            Your feedback has been submitted and is now <strong>pending review</strong>. You'll get a
            notification when it's reviewed or resolved.
          </p>
          <div className="mt-6 grid gap-2 sm:flex sm:justify-center">
            <Button asChild>
              <Link to="/my-feedback">Track my feedback</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setForm({ ...empty, name: me?.fullName ?? "", email: me?.email ?? "" });
                setDone(false);
              }}
            >
              Submit another
            </Button>
          </div>
        </div>
      </StudentShell>
    );
  }

  const len = form.message.trim().length;

  return (
    <StudentShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Give feedback</h1>
        <p className="mt-1 text-muted-foreground">Help us improve your college experience.</p>
      </div>
      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:col-span-3">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted p-4">
            <div className="flex items-start gap-3">
              <EyeOff className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="anon" className="font-semibold">Submit anonymously</Label>
                <p className="text-xs text-muted-foreground">Your name and email won't be shared with staff.</p>
              </div>
            </div>
            <Switch id="anon" checked={form.is_anonymous} onCheckedChange={(v) => set("is_anonymous", v)} />
          </div>

          {!form.is_anonymous && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Topic</Label>
            <Select value={form.topic} onValueChange={(v) => set("topic", v)}>
              <SelectTrigger aria-invalid={!!errors.topic}>
                <SelectValue placeholder="Choose a topic" />
              </SelectTrigger>
              <SelectContent>
                {TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.topic && <p className="text-xs text-destructive">{errors.topic}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={7}
              maxLength={MESSAGE_MAX}
              placeholder="Tell us what's working well and what could be better…"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              aria-invalid={!!errors.message}
            />
            <div className="flex justify-between text-xs">
              <span className="text-destructive">{errors.message}</span>
              <span className={cn("tabular-nums text-muted-foreground", len > MESSAGE_MAX * 0.9 && "text-warning-foreground dark:text-warning")}>
                {form.message.length}/{MESSAGE_MAX}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Your ratings</h2>
            <StarInput label="Rating" value={form.rating} onChange={(v) => set("rating", v)} error={errors.rating} />
            <div className="h-px bg-border" />
            <StarInput label="Teaching" value={form.teaching_rating} onChange={(v) => set("teaching_rating", v)} error={errors.teaching_rating} />
            <StarInput label="Facilities" value={form.facilities_rating} onChange={(v) => set("facilities_rating", v)} error={errors.facilities_rating} />
            <StarInput label="Support" value={form.support_rating} onChange={(v) => set("support_rating", v)} error={errors.support_rating} />
            <StarInput label="Overall experience" value={form.overall_rating} onChange={(v) => set("overall_rating", v)} error={errors.overall_rating} />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit feedback
          </Button>
        </div>
      </form>
    </StudentShell>
  );
}
