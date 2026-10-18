import { useEffect } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import type { Feedback } from "@/lib/feedback";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
    return { userId: data.user.id };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const role = me?.role;

  useEffect(() => {
    if (!role) return;
    const channel = supabase
      .channel(`feedback-${role}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["feedback"] });
        if (role === "admin" && payload.eventType === "INSERT") {
          toast.info("New feedback received", {
            description: (payload.new as Feedback).topic,
          });
        }
        if (role === "student" && payload.eventType === "UPDATE") {
          const next = payload.new as Feedback;
          const prev = payload.old as Partial<Feedback>;
          if (prev.status === next.status) {
            if (next.admin_response && next.admin_response !== prev.admin_response)
              toast.info("The administration replied to your feedback", { description: next.topic });
            return;
          }
          if (next.status === "reviewed")
            toast.info("Your feedback has been reviewed", { description: next.topic });
          if (next.status === "resolved")
            toast.success("Your feedback has been resolved", { description: next.topic });
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, queryClient]);

  return <Outlet />;
}
