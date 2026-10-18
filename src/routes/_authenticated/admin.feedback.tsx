import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, MessageSquareReply, Search, X } from "lucide-react";
import { displayName, downloadCsv, feedbackQuery, STATUSES, STATUS_LABEL, TOPICS, type Feedback } from "@/lib/feedback";
import { StatusBadge, Stars } from "@/components/feedback-ui";
import { FeedbackDetailDialog } from "@/components/feedback-detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/feedback")({
  head: () => ({
    meta: [
      { title: "Manage Feedback — Campus Voice" },
      { name: "description", content: "Search, filter, respond to and resolve student feedback." },
      { property: "og:title", content: "Manage Feedback — Campus Voice" },
      { property: "og:description", content: "Search, filter and respond to feedback." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(feedbackQuery),
  component: ManageFeedback,
});

function ManageFeedback() {
  const { data } = useSuspenseQuery(feedbackQuery);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("all");
  const [rating, setRating] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [openId, setOpenId] = useState<string | null>(null);
  const open = data.find((f) => f.id === openId) ?? null;

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = data.filter((f) => {
      if (topic !== "all" && f.topic !== topic) return false;
      if (rating !== "all" && f.rating !== Number(rating)) return false;
      if (status !== "all" && f.status !== status) return false;
      if (!needle) return true;
      return [f.message, f.topic, f.admin_response, f.is_anonymous ? "anonymous" : `${f.name} ${f.email}`]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
    return sort === "oldest" ? [...out].reverse() : out;
  }, [data, q, topic, rating, status, sort]);

  const filtered = q || topic !== "all" || rating !== "all" || status !== "all";
  const clear = () => { setQ(""); setTopic("all"); setRating("all"); setStatus("all"); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Feedback</h1>
          <p className="text-muted-foreground">{list.length} of {data.length} entries</p>
        </div>
        <Button variant="outline" onClick={() => downloadCsv(list)} disabled={!list.length}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search message, name, email…" className="pl-9" aria-label="Search feedback" />
        </div>
        <Filter value={topic} onChange={setTopic} label="All topics" options={TOPICS.map((t) => [t, t])} />
        <Filter value={rating} onChange={setRating} label="All ratings" options={[5, 4, 3, 2, 1].map((r) => [String(r), `${r} star${r > 1 ? "s" : ""}`])} />
        <Filter value={status} onChange={setStatus} label="All statuses" options={STATUSES.map((s) => [s, STATUS_LABEL[s]])} />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger aria-label="Sort"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={clear} className="justify-self-start sm:col-span-2 lg:col-span-6">
            <X className="mr-1 h-4 w-4" /> Clear filters
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">No feedback matches your filters.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">Topic</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.map((f) => (
                  <tr key={f.id} onClick={() => setOpenId(f.id)} className="cursor-pointer transition hover:bg-muted/60">
                    <td className="px-4 py-3 font-medium">{displayName(f)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{f.topic}</td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate text-muted-foreground">{f.message}</p>
                      {f.admin_response && <p className="mt-0.5 flex items-center gap-1 text-xs text-primary"><MessageSquareReply className="h-3 w-3" /> Replied</p>}
                    </td>
                    <td className="px-4 py-3"><Stars value={f.rating} /></td>
                    <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{format(new Date(f.created_at), "d MMM yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {list.map((f) => <MobileCard key={f.id} f={f} onOpen={() => setOpenId(f.id)} />)}
          </div>
        </>
      )}
      <FeedbackDetailDialog feedback={open} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  );
}

function MobileCard({ f, onOpen }: { f: Feedback; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full rounded-2xl border bg-card p-4 text-left shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{displayName(f)}</span>
        <StatusBadge status={f.status} />
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {f.topic} · {format(new Date(f.created_at), "d MMM yyyy")}
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{f.message}</p>
      <div className="mt-2 flex items-center justify-between">
        <Stars value={f.rating} />
        {f.admin_response && <span className="flex items-center gap-1 text-xs text-primary"><MessageSquareReply className="h-3 w-3" /> Replied</span>}
      </div>
    </button>
  );
}

function Filter({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: [string, string][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}</SelectItem>
        {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
