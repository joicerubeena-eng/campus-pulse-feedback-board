import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth-card";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Campus Voice" },
      { name: "description", content: "Administrator access to the feedback dashboard and reports." },
      { property: "og:title", content: "Admin Login — Campus Voice" },
      { property: "og:description", content: "Administrator access to the feedback dashboard." },
    ],
  }),
  component: () => <AuthCard kind="admin" />,
});
