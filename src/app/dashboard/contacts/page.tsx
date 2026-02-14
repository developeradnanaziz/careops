"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/lib/supabase-client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { Contact } from "@/types";
import AddContactDialog from "@/components/AddContactDialog";

export default function ContactsPage() {
  const { workspaceId } = useWorkspace();
  const supabase = createClient();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchContacts = useCallback(async () => {
    let query = supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data } = await query;
    setContacts((data as Contact[]) ?? []);
    setLoading(false);
  }, [supabase, workspaceId, search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Contacts</h1>
          <p className="text-sm text-zinc-500 mt-1">{contacts.length} total contacts</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={16} />
          Add contact
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">Loading...</td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">
                  {search ? "No contacts match your search." : "No contacts yet."}
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-900 font-medium">
                    {c.name}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{c.email}</td>
                  <td className="px-5 py-3 text-zinc-600">{c.phone || "—"}</td>
                  <td className="px-5 py-3 text-zinc-600">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Contact Dialog */}
      {showAdd && (
        <AddContactDialog
          workspaceId={workspaceId}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            fetchContacts();
          }}
        />
      )}
    </div>
  );
}
