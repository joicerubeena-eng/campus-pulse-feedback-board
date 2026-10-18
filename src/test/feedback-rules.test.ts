import { describe, expect, it } from "vitest";
import { computeStats, feedbackSchema, toCsv, type Feedback } from "@/lib/feedback";

const base: Feedback = {
  id: "1", user_id: "u", name: "Ana", email: "ana@x.edu", is_anonymous: false, topic: "General",
  rating: 5, teaching_rating: 4, facilities_rating: 3, support_rating: 5, overall_rating: 4,
  message: "Great classes this term", status: "pending", admin_response: null, responded_at: null,
  created_at: "2026-10-01T10:00:00Z", updated_at: "2026-10-01T10:00:00Z",
};
const valid = {
  is_anonymous: false, name: "Ana", email: "ana@x.edu", topic: "General", rating: 5,
  teaching_rating: 4, facilities_rating: 3, support_rating: 5, overall_rating: 4,
  message: "Great classes this term",
};

describe("feedback rules", () => {
  it("counts 4-5 as positive and 1-2 as negative", () => {
    const s = computeStats([{ ...base, rating: 4 }, { ...base, rating: 3 }, { ...base, rating: 2 }]);
    expect(s.positive).toBe(1);
    expect(s.negative).toBe(1);
  });
  it("anonymous feedback does not require name or email", () => {
    expect(feedbackSchema.safeParse({ ...valid, is_anonymous: true, name: "", email: "" }).success).toBe(true);
    expect(feedbackSchema.safeParse({ ...valid, name: "", email: "" }).success).toBe(false);
  });
  it("requires all four category ratings", () => {
    expect(feedbackSchema.safeParse({ ...valid, support_rating: 0 }).success).toBe(false);
  });
  it("message must be 10 to 1000 characters", () => {
    expect(feedbackSchema.safeParse({ ...valid, message: "short" }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...valid, message: "a".repeat(1001) }).success).toBe(false);
  });
  it("CSV hides email of anonymous feedback", () => {
    expect(toCsv([{ ...base, is_anonymous: true }])).not.toContain("ana@x.edu");
  });
});
