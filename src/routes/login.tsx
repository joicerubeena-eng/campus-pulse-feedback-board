import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth-card";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Student Login — Campus Voice" },
      { name: "description", content: "Sign in to submit and track your college feedback." },
      { property: "og:title", content: "Student Login — Campus Voice" },
      { property: "og:description", content: "Sign in to submit and track your college feedback." },
    ],
  }),
  component: () => <AuthCard kind="student" />,
});
