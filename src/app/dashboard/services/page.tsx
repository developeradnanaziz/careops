"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/lib/supabase-client";
import { useCallback, useEffect, useState } from "react";
import type { Service } from "@/types";
import { Plus, Pencil, Trash2, Clock, DollarSign } from "lucide-react";

export default function ServicesPage() {
  const { workspaceId } = useWorkspace();
  const supabase = createClient();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration_minutes: 30,
    price: 0,
    active: true,
  });

  const fetchServices = useCallback(async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name");
    setServices((data as Service[]) ?? []);
    setLoading(false);
  }, [supabase, workspaceId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const resetForm = () => {
    setForm({ name: "", description: "", duration_minutes: 30, price: 0, active: true });
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    if (editId) {
      await supabase.from("services").update(form).eq("id", editId);
    } else {
      await supabase.from("services").insert({ ...form, workspace_id: workspaceId });
    }
    resetForm();
    fetchServices();
  };

  const handleEdit = (s: Service) => {
    setForm({
      name: s.name,
      description: s.description ?? "",
      duration_minutes: s.duration_minutes,
      price: s.price,
      active: s.active,
    });
    setEditId(s.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
    fetchServices();
  };

  const toggleActive = async (s: Service) => {
    await supabase.from("services").update({ active: !s.active }).eq("id", s.id);
    fetchServices();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-zinc-200 rounded" />
          <div className="h-32 bg-zinc-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Services</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage the services you offer to clients
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
          <h2 className="font-semibold text-zinc-900 mb-4">
            {editId ? "Edit Service" : "New Service"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="e.g., Consultation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })
                }
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                }
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
              <select
                value={form.active ? "active" : "inactive"}
                onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              {editId ? "Update" : "Create"}
            </button>
            <button
              onClick={resetForm}
              className="border border-zinc-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-400 text-sm">
          No services yet. Click &quot;Add Service&quot; to create your first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-xl border p-5 ${
                s.active ? "border-zinc-200" : "border-zinc-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-zinc-900">{s.name}</h3>
                  {s.description && (
                    <p className="text-xs text-zinc-500 mt-0.5">{s.description}</p>
                  )}
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    s.active
                      ? "bg-green-50 text-green-600"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {s.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {s.duration_minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={12} /> ${s.price.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2 border-t border-zinc-100 pt-3">
                <button
                  onClick={() => handleEdit(s)}
                  className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => toggleActive(s)}
                  className="text-xs text-zinc-500 hover:text-zinc-800"
                >
                  {s.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 ml-auto"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
