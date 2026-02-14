"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/lib/supabase-client";
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import type { InventoryItem } from "@/types";
import AddInventoryDialog from "@/components/AddInventoryDialog";

export default function InventoryPage() {
  const { workspaceId } = useWorkspace();
  const supabase = createClient();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);

  const fetchItems = useCallback(async () => {
    let query = supabase
      .from("inventory")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }

    const { data } = await query;
    let results = (data as InventoryItem[]) ?? [];

    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.description?.toLowerCase().includes(s) ||
          i.category.toLowerCase().includes(s)
      );
    }

    setItems(results);
    setLoading(false);
  }, [supabase, workspaceId, search, categoryFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const updateQuantity = async (id: string, quantity: number) => {
    await supabase
      .from("inventory")
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq("id", id);
    setEditingId(null);
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this inventory item?")) return;
    await supabase.from("inventory").delete().eq("id", id);
    fetchItems();
  };

  const categories = ["all", ...new Set(items.map((i) => i.category))];
  const lowStockCount = items.filter((i) => i.quantity <= i.min_quantity).length;
  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.cost_per_unit, 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Inventory</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items.length} items · Total value ${totalValue.toFixed(2)}
            {lowStockCount > 0 && (
              <span className="text-red-500 ml-2">
                · {lowStockCount} low stock
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={16} />
          Add item
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Package size={16} />
            <span className="text-xs font-medium">Total Items</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{items.length}</p>
        </div>
        <div className={`rounded-xl border p-4 ${lowStockCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-zinc-200"}`}>
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <AlertTriangle size={16} className={lowStockCount > 0 ? "text-red-500" : ""} />
            <span className="text-xs font-medium">Low Stock</span>
          </div>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-red-600" : "text-zinc-900"}`}>
            {lowStockCount}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <span className="text-xs font-medium">💰 Total Value</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">${totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All categories" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-5 py-3 font-medium">Item</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Qty</th>
              <th className="px-5 py-3 font-medium">Min</th>
              <th className="px-5 py-3 font-medium">Unit</th>
              <th className="px-5 py-3 font-medium">Cost/Unit</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-zinc-400">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-zinc-400">
                  {search ? "No items match your search." : "No inventory items yet."}
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isLow = item.quantity <= item.min_quantity;
                const isEditing = editingId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-zinc-50 hover:bg-zinc-50 ${
                      isLow ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-zinc-900 font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={editQty}
                            onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                            className="w-16 border border-zinc-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                          />
                          <button
                            onClick={() => updateQuantity(item.id, editQty)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-zinc-400 hover:text-zinc-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`font-medium ${isLow ? "text-red-600" : "text-zinc-900"}`}
                        >
                          {item.quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{item.min_quantity}</td>
                    <td className="px-5 py-3 text-zinc-500">{item.unit}</td>
                    <td className="px-5 py-3 text-zinc-600">
                      ${item.cost_per_unit.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      {isLow ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                          <AlertTriangle size={12} />
                          Low stock
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-green-600">In stock</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditQty(item.quantity);
                          }}
                          className="text-zinc-400 hover:text-zinc-600"
                          title="Edit quantity"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-zinc-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Inventory Dialog */}
      {showAdd && (
        <AddInventoryDialog
          workspaceId={workspaceId}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}
