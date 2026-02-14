"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/lib/supabase-client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import type { Booking, Contact } from "@/types";
import Link from "next/link";

export default function BookingsPage() {
  const { workspaceId } = useWorkspace();
  const supabase = createClient();

  const [bookings, setBookings] = useState<(Booking & { contacts: Contact })[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    let query = supabase
      .from("bookings")
      .select("*, contacts(*)")
      .eq("workspace_id", workspaceId)
      .order("date", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    let results = (data as (Booking & { contacts: Contact })[]) ?? [];

    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (b) =>
          b.contacts?.name?.toLowerCase().includes(s) ||
          b.contacts?.email?.toLowerCase().includes(s) ||
          b.service.toLowerCase().includes(s)
      );
    }

    setBookings(results);
    setLoading(false);
  }, [supabase, workspaceId, search, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = async (bookingId: string, status: string) => {
    await supabase.from("bookings").update({ status }).eq("id", bookingId);
    fetchBookings();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Bookings</h1>
          <p className="text-sm text-zinc-500 mt-1">{bookings.length} bookings</p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={16} />
          New booking
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No-show</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">Service</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-zinc-400">Loading...</td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-zinc-400">
                  No bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-zinc-900 font-medium">{b.contacts?.name ?? "—"}</p>
                      <p className="text-xs text-zinc-500">{b.contacts?.email ?? ""}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-xs">
                      {b.service}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{b.date}</td>
                  <td className="px-5 py-3 text-zinc-600">{b.time}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        b.status === "confirmed"
                          ? "bg-green-50 text-green-700"
                          : b.status === "cancelled"
                          ? "bg-red-50 text-red-700"
                          : b.status === "completed"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={b.status}
                      onChange={(e) => updateStatus(b.id, e.target.value)}
                      className="border border-zinc-200 rounded px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no-show">No-show</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
