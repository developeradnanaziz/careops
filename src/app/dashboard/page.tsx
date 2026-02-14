"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/lib/supabase-client";
import { useCallback, useEffect, useState } from "react";
import {
  Users,
  CalendarDays,
  MessageSquare,
  TrendingUp,
  Inbox,
  PackageSearch,
  AlertTriangle,
  FileText,
  Bell,
  Clock,
} from "lucide-react";
import type { Booking, Contact, Conversation } from "@/types";
import StatCard from "@/components/StatCard";
import Link from "next/link";

export default function DashboardPage() {
  const { workspaceId } = useWorkspace();
  const supabase = createClient();

  const [totalContacts, setTotalContacts] = useState(0);
  const [todayBookings, setTodayBookings] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [openConversations, setOpenConversations] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [upcomingBookings, setUpcomingBookings] = useState(0);
  const [pendingForms, setPendingForms] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [recentBookings, setRecentBookings] = useState<(Booking & { contacts: Contact })[]>([]);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const fetchStats = useCallback(async () => {
    const [
      contactsRes,
      todayRes,
      totalRes,
      recentRes,
      convRes,
      msgRes,
      inventoryRes,
      recentConvRes,
      upcomingRes,
      pendingFormsRes,
      alertsRes,
    ] = await Promise.all([
      supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("date", today),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("bookings")
        .select("*, contacts(*)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "open"),
      supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("inventory")
        .select("quantity, min_quantity")
        .eq("workspace_id", workspaceId),
      supabase
        .from("conversations")
        .select("*, contacts(*)")
        .eq("workspace_id", workspaceId)
        .order("last_message_at", { ascending: false })
        .limit(4),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "confirmed")
        .gte("date", today)
        .lte("date", tomorrow),
      supabase
        .from("form_submissions")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "pending"),
      supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("resolved", false),
    ]);

    setTotalContacts(contactsRes.count ?? 0);
    setTodayBookings(todayRes.count ?? 0);
    setTotalBookings(totalRes.count ?? 0);
    setOpenConversations(convRes.count ?? 0);
    setTotalMessages(msgRes.count ?? 0);
    // Count items where quantity is at or below their individual min threshold
    const lowCount = (inventoryRes.data as { quantity: number; min_quantity: number }[] ?? [])
      .filter((i) => i.quantity <= i.min_quantity).length;
    setLowStockItems(lowCount);
    setUpcomingBookings(upcomingRes.count ?? 0);
    setPendingForms(pendingFormsRes.count ?? 0);
    setActiveAlerts(alertsRes.count ?? 0);
    setRecentBookings((recentRes.data as (Booking & { contacts: Contact })[]) ?? []);
    setRecentConversations((recentConvRes.data as Conversation[]) ?? []);
    setLoading(false);
  }, [supabase, workspaceId, today, tomorrow]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-zinc-200 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 bg-zinc-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const contactOf = (c: Conversation) => c.contacts as unknown as Contact;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Overview of your workspace activity</p>
      </div>

      {/* Stats Grid — 9 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Contacts"
          value={totalContacts}
          icon={Users}
          accent="bg-blue-50"
          href="/dashboard/contacts"
        />
        <StatCard
          label="Today's Bookings"
          value={todayBookings}
          icon={CalendarDays}
          accent="bg-green-50"
          href="/dashboard/bookings"
        />
        <StatCard
          label="Upcoming (7d)"
          value={upcomingBookings}
          icon={Clock}
          accent="bg-indigo-50"
          href="/dashboard/bookings"
        />
        <StatCard
          label="Open Conversations"
          value={openConversations}
          icon={Inbox}
          accent="bg-amber-50"
          href="/dashboard/inbox"
        />
        <StatCard
          label="Total Messages"
          value={totalMessages}
          icon={MessageSquare}
          accent="bg-cyan-50"
          href="/dashboard/inbox"
        />
        <StatCard
          label="Pending Forms"
          value={pendingForms}
          icon={FileText}
          accent={pendingForms > 0 ? "bg-amber-50" : "bg-zinc-100"}
          href="/dashboard/forms"
        />
        <StatCard
          label="Total Bookings"
          value={totalBookings}
          icon={TrendingUp}
          accent="bg-purple-50"
          href="/dashboard/bookings"
        />
        <StatCard
          label="Low-Stock Items"
          value={lowStockItems}
          icon={lowStockItems > 0 ? AlertTriangle : PackageSearch}
          accent={lowStockItems > 0 ? "bg-red-50" : "bg-zinc-100"}
          trend={
            lowStockItems > 0
              ? { value: `${lowStockItems} need restock`, positive: false }
              : undefined
          }
          href="/dashboard/inventory"
        />
        <StatCard
          label="Active Alerts"
          value={activeAlerts}
          icon={Bell}
          accent={activeAlerts > 0 ? "bg-red-50" : "bg-zinc-100"}
          trend={
            activeAlerts > 0
              ? { value: `${activeAlerts} need attention`, positive: false }
              : undefined
          }
          href="/dashboard/alerts"
        />
      </div>

      {/* Two-column layout: Recent Bookings + Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">Recent Bookings</h2>
            <Link
              href="/dashboard/bookings"
              className="text-xs text-zinc-500 hover:text-zinc-800"
            >
              View all →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-zinc-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-zinc-400">
                    No bookings yet.
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr key={b.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-900">{b.contacts?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-xs">
                        {b.service}
                      </span>
                    </td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">Recent Conversations</h2>
            <Link
              href="/dashboard/inbox"
              className="text-xs text-zinc-500 hover:text-zinc-800"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {recentConversations.length === 0 ? (
              <div className="px-5 py-8 text-center text-zinc-400 text-sm">
                No conversations yet.
              </div>
            ) : (
              recentConversations.map((conv) => {
                const contact = contactOf(conv);
                return (
                  <Link
                    key={conv.id}
                    href="/dashboard/inbox"
                    className="flex items-start gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {contact?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {contact?.name ?? "Unknown"}
                        </p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                            conv.status === "open"
                              ? "bg-green-50 text-green-600"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {conv.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate">
                        {conv.last_message ?? "No messages yet"}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
