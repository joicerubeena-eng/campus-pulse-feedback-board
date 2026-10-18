import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "student";

export async function fetchRole(userId: string): Promise<Role> {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return data ? "admin" : "student";
}

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return null;
    const [role, profile] = await Promise.all([
      fetchRole(user.id),
      supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    ]);
    return {
      id: user.id,
      email: user.email ?? "",
      fullName: profile.data?.full_name || (user.user_metadata?.full_name as string) || "",
      role,
    };
  },
});

export function useMe() {
  return useQuery(meQuery);
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };
}
