import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { Inbox, MessageSquareReply } from "lucide-react";
import { feedbackQuery } from "@/lib/feedback";
import { useMe } from "@/lib/auth";
import { StudentShell } from "@/components/student-shell";
import { StatusBadge, Stars } from "@/components/feedback-ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/my-feedback")({
  head: () => ({
    meta: [
      { title: "My Feedback — Campus Voice" },
      { name: "description", content: "Track the status of your feedback and read replies." },
      { property: "og:title", content: "My Feedback — Campus Voice" },
      { property: "og:description", content: "Track your feedback and read replies." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(feedbackQuery),
  component: MyFeedback,
});

function MyFeedback() {
  const { data } = useSuspenseQuery(feedbackQuery);
  const { data: me } = useMe();
  const mine = data.filter((f) => f.user_id === me?.id);

  // Notify about status changes that happened while the student was away.
  useEffect(() => {
    if (!me) return;
    const key = `seen-status-${me.id}`;
    const seen: Record<string, string> = JSON.parse(localStorage.getItem(key) || "{}");
    mine.forEach((f) => {
      const was = seen[f.id];
      if (was && was !== f.status) {
        if (f.status === "reviewed") toast.info("Your feedback has been reviewed", { description: f.topic });
        if (f.status === "resolved") toast.success("Your feedback has been resolved", { description: f.topic });
      }
    });
    localStorage.setItem(key, JSON.stringify(Object.fromEntries(mine.map((f) => [f.id, f.status]))));
  }, [me, mine]);

  return (
    <StudentShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">My feedback</h1>
          <p className="mt-1 text-muted-foreground">Follow progress and read replies from the administration.</p>
        </div>
        <Button asChild><Link to="/submit">New feedback</Link></Button>
      </div>

      {mine.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">You haven't submitted any feedback yet.</p>
          <Button asChild className="mt-4"><Link to="/submit">Give feedback</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          {mine.map((f) => (
            <article key={f.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{f.topic}</span>
                  <Stars value={f.rating} />
                  {f.is_anonymous && <span className="text-xs text-muted-foreground">· Anonymous</span>}
                </div>
                <StatusBadge status={f.status} />
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{f.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">{format(new Date(f.created_at), "d MMM yyyy, HH:mm")}</p>
              {f.admin_response && (
                <div className="mt-4 rounded-xl border-l-4 border-primary bg-accent/60 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                    <MessageSquareReply className="h-4 w-4" /> Admin response
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{f.admin_response}</p>
                  {f.responded_at && (
                    <p className="mt-1 text-xs text-muted-foreground">{format(new Date(f.responded_at), "d MMM yyyy")}</p>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </StudentShell>
  );
}
