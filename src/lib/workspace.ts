import { createClient } from "@/lib/supabase-server";
import type { Workspace } from "@/types";

export async function getWorkspaceForUser(): Promise<Workspace | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's workspace directly (single-tenant MVP)
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return workspace as Workspace | null;
}
