"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/lib/supabase-client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { workspaceId, workspaceName } = useWorkspace();
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState(workspaceName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const fetchUser = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserEmail(user?.email ?? "");
  }, [supabase]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await supabase
      .from("workspaces")
      .update({ name })
      .eq("id", workspaceId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your workspace and account</p>
      </div>

      {/* Workspace Settings */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Workspace</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Workspace name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            {saved && (
              <span className="text-sm text-green-600">Saved!</span>
            )}
          </div>
        </form>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-zinc-500">Email</p>
            <p className="text-sm text-zinc-900">{userEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
