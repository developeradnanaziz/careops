import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getWorkspaceForUser } from "@/lib/workspace";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const workspace = await getWorkspaceForUser();

  if (!workspace) {
    redirect("/onboarding");
  }

  return (
    <WorkspaceProvider workspaceId={workspace.id} workspaceName={workspace.name}>
      <div className="min-h-screen bg-zinc-50 flex">
        <Sidebar
          workspaceName={workspace.name}
          userEmail={user.email ?? ""}
        />
        <main className="flex-1 min-h-screen pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
