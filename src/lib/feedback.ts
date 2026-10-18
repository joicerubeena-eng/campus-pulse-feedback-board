import { z } from "zod";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Feedback = Database["public"]["Tables"]["feedback"]["Row"];
export type FeedbackStatus = Database["public"]["Enums"]["feedback_status"];

export const TOPICS = [
  "General",
  "Academics/Teaching",
  "Facilities",
  "Support",
  "Idea",
  "Praise",
] as const;

export const STATUSES: FeedbackStatus[] = ["pending", "reviewed", "resolved"];
export const STATUS_LABEL: Record<FeedbackStatus, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  resolved: "Resolved",
};

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 1000;

const stars = (label: string) =>
  z
    .number({ invalid_type_error: `Please rate ${label}` })
    .int()
    .min(1, `Please rate ${label}`)
    .max(5);

export const feedbackSchema = z
  .object({
    is_anonymous: z.boolean(),
    name: z.string().trim().max(100, "Name must be under 100 characters"),
    email: z.string().trim().max(255, "Email must be under 255 characters"),
    topic: z.enum(TOPICS, { errorMap: () => ({ message: "Please choose a topic" }) }),
    rating: stars("your experience"),
    teaching_rating: stars("teaching"),
    facilities_rating: stars("facilities"),
    support_rating: stars("support"),
    overall_rating: stars("overall experience"),
    message: z
      .string()
      .trim()
      .min(MESSAGE_MIN, `Message must be at least ${MESSAGE_MIN} characters`)
      .max(MESSAGE_MAX, `Message must be under ${MESSAGE_MAX} characters`),
  })
  .superRefine((v, ctx) => {
    if (v.is_anonymous) return;
    if (!v.name) ctx.addIssue({ path: ["name"], code: "custom", message: "Please enter your name" });
    if (!z.string().email().safeParse(v.email).success)
      ctx.addIssue({ path: ["email"], code: "custom", message: "Please enter a valid email" });
  });

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const feedbackQuery = queryOptions({
  queryKey: ["feedback"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

/** Positive = main rating 4–5, negative = 1–2, 3 is neutral. */
export const isPositive = (f: Pick<Feedback, "rating">) => f.rating >= 4;
export const isNegative = (f: Pick<Feedback, "rating">) => f.rating <= 2;

const avg = (nums: number[]) =>
  nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;

export function computeStats(list: Feedback[]) {
  return {
    total: list.length,
    average: avg(list.map((f) => f.rating)),
    positive: list.filter(isPositive).length,
    negative: list.filter(isNegative).length,
    pending: list.filter((f) => f.status === "pending").length,
    reviewed: list.filter((f) => f.status === "reviewed").length,
    resolved: list.filter((f) => f.status === "resolved").length,
    categories: [
      { name: "Teaching", value: avg(list.map((f) => f.teaching_rating)) },
      { name: "Facilities", value: avg(list.map((f) => f.facilities_rating)) },
      { name: "Support", value: avg(list.map((f) => f.support_rating)) },
      { name: "Overall", value: avg(list.map((f) => f.overall_rating)) },
    ],
    distribution: [1, 2, 3, 4, 5].map((r) => ({
      rating: `${r}★`,
      count: list.filter((f) => f.rating === r).length,
    })),
    topics: TOPICS.map((t) => ({ name: t, value: list.filter((f) => f.topic === t).length })).filter(
      (t) => t.value > 0,
    ),
  };
}

export function monthlyStats(list: Feedback[], months = 6, now = new Date()) {
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const items = list.filter((f) => f.created_at.slice(0, 7) === key);
    out.push({
      key,
      month: d.toLocaleString("en", { month: "short", year: "2-digit" }),
      count: items.length,
      average: avg(items.map((f) => f.rating)),
      teaching: avg(items.map((f) => f.teaching_rating)),
      facilities: avg(items.map((f) => f.facilities_rating)),
      support: avg(items.map((f) => f.support_rating)),
      overall: avg(items.map((f) => f.overall_rating)),
      positive: items.filter(isPositive).length,
      negative: items.filter(isNegative).length,
      resolved: items.filter((f) => f.status === "resolved").length,
    });
  }
  return out;
}

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(list: Feedback[]) {
  const header = [
    "Date", "Name", "Email", "Anonymous", "Topic", "Rating", "Teaching", "Facilities",
    "Support", "Overall", "Status", "Message", "Admin response",
  ];
  const rows = list.map((f) => [
    f.created_at, f.is_anonymous ? "Anonymous" : f.name, f.is_anonymous ? "" : f.email,
    f.is_anonymous ? "Yes" : "No", f.topic, f.rating, f.teaching_rating, f.facilities_rating,
    f.support_rating, f.overall_rating, STATUS_LABEL[f.status], f.message, f.admin_response,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export function downloadCsv(list: Feedback[]) {
  const blob = new Blob([toCsv(list)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feedback-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const displayName = (f: Feedback) => (f.is_anonymous ? "Anonymous" : f.name || "Unknown");
