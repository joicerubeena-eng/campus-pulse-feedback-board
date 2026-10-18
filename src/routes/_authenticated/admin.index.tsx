import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { CheckCircle2, Clock, MessagesSquare, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { computeStats, displayName, feedbackQuery, monthlyStats, type Feedback } from "@/lib/feedback";
import { StatCard, Panel, chartTooltip, axisProps } from "@/components/stat-card";
import { StatusBadge, Stars } from "@/components/feedback-ui";
import { FeedbackDetailDialog } from "@/components/feedback-detail-dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Campus Voice" },
      { name: "description", content: "Overview of college feedback, ratings and status." },
      { property: "og:title", content: "Admin Dashboard — Campus Voice" },
      { property: "og:description", content: "Overview of college feedback." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(feedbackQuery),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

function Dashboard() {
  const { data } = useSuspenseQuery(feedbackQuery);
  const s = computeStats(data);
  const months = monthlyStats(data);
  const [open, setOpen] = useState<Feedback | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">A snapshot of what students are saying.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total feedback" value={s.total} icon={MessagesSquare} />
        <StatCard label="Average rating" value={s.total ? s.average.toFixed(1) : "–"} icon={Star} tone="star" hint="out of 5" />
        <StatCard label="Positive" value={s.positive} icon={ThumbsUp} tone="success" hint="4–5 stars" />
        <StatCard label="Negative" value={s.negative} icon={ThumbsDown} tone="destructive" hint="1–2 stars" />
        <StatCard label="Pending" value={s.pending} icon={Clock} tone="warning" />
        <StatCard label="Resolved" value={s.resolved} icon={CheckCircle2} tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Feedback trend" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={months}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis allowDecimals={false} {...axisProps} width={28} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="count" name="Feedback" stroke="var(--chart-1)" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="By topic">
          <div className="h-64">
            {s.topics.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={s.topics} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {s.topics.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </div>
        </Panel>
        <Panel title="Rating breakdown">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={s.distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="rating" {...axisProps} />
                <YAxis allowDecimals={false} {...axisProps} width={28} />
                <Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="count" name="Feedback" radius={[6, 6, 0, 0]}>
                  {s.distribution.map((_, i) => <Cell key={i} fill={i < 2 ? "var(--chart-4)" : i === 2 ? "var(--chart-2)" : "var(--chart-3)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Category averages" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={s.categories} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} {...axisProps} />
                <YAxis type="category" dataKey="name" {...axisProps} width={72} />
                <Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="value" name="Average" fill="var(--chart-1)" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Recent feedback" action={<Button asChild variant="outline" size="sm"><Link to="/admin/feedback">View all</Link></Button>}>
        {data.length === 0 ? <Empty /> : (
          <ul className="divide-y">
            {data.slice(0, 6).map((f) => (
              <li key={f.id}>
                <button onClick={() => setOpen(f)} className="flex w-full flex-col gap-1 rounded-lg px-2 py-3 text-left transition hover:bg-muted sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {displayName(f)} <span className="text-xs font-normal text-muted-foreground">· {f.topic}</span>
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{f.message}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Stars value={f.rating} />
                    <StatusBadge status={f.status} />
                    <span className="hidden w-24 text-right text-xs text-muted-foreground md:inline">{formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <FeedbackDetailDialog feedback={open} onOpenChange={(o) => !o && setOpen(null)} />
    </div>
  );
}

function Empty() {
  return <div className="grid h-full min-h-24 place-items-center text-sm text-muted-foreground">No feedback yet</div>;
}
