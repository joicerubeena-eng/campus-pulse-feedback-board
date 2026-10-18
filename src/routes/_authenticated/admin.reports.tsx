import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Printer } from "lucide-react";
import { computeStats, downloadCsv, feedbackQuery, monthlyStats } from "@/lib/feedback";
import { Panel, chartTooltip, axisProps } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Campus Voice" },
      { name: "description", content: "Monthly feedback statistics, rating trends, CSV export and printable reports." },
      { property: "og:title", content: "Reports — Campus Voice" },
      { property: "og:description", content: "Monthly feedback statistics and rating trends." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(feedbackQuery),
  component: Reports,
});

function Reports() {
  const { data } = useSuspenseQuery(feedbackQuery);
  const [range, setRange] = useState("6");
  const months = monthlyStats(data, Number(range));
  const s = computeStats(data);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generated {format(new Date(), "d MMMM yyyy, HH:mm")}</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40" aria-label="Report period"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => downloadCsv(data)} disabled={!data.length}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Total feedback", s.total],
          ["Average rating", s.total ? s.average.toFixed(1) : "–"],
          ["Resolution rate", s.total ? `${Math.round((s.resolved / s.total) * 100)}%` : "–"],
          ["Positive share", s.total ? `${Math.round((s.positive / s.total) * 100)}%` : "–"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{l}</p>
            <p className="mt-1 font-display text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-1">
        <Panel title="Monthly feedback">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis allowDecimals={false} {...axisProps} width={28} />
                <Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="positive" name="Positive" stackId="a" fill="var(--chart-3)" />
                <Bar dataKey="negative" name="Negative" stackId="a" fill="var(--chart-4)" />
                <Bar dataKey="count" name="Total" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Rating trends">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis domain={[0, 5]} {...axisProps} width={28} />
                <Tooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="teaching" name="Teaching" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="facilities" name="Facilities" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="support" name="Support" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="overall" name="Overall" stroke="var(--chart-5)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Monthly statistics">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="border-b">
                {["Month", "Feedback", "Avg rating", "Teaching", "Facilities", "Support", "Overall", "Positive", "Negative", "Resolved"].map((h) => (
                  <th key={h} className="px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {months.map((m) => (
                <tr key={m.key}>
                  <td className="px-3 py-2 font-medium">{m.month}</td>
                  <td className="px-3 py-2">{m.count}</td>
                  {[m.average, m.teaching, m.facilities, m.support, m.overall].map((v, i) => (
                    <td key={i} className="px-3 py-2">{m.count ? v.toFixed(1) : "–"}</td>
                  ))}
                  <td className="px-3 py-2">{m.positive}</td>
                  <td className="px-3 py-2">{m.negative}</td>
                  <td className="px-3 py-2">{m.resolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
