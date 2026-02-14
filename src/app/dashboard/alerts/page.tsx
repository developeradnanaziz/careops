"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/lib/supabase-client";
import { useCallback, useEffect, useState } from "react";
import type { Alert } from "@/types";
import { Bell, Check, AlertTriangle, FileText, MessageSquare, CalendarDays } from "lucide-react";
import Link from "next/link";

const iconMap: Record<string, typeof AlertTriangle> = {
  low_stock: AlertTriangle,
  overdue_form: FileText,
  unanswered_message: MessageSquare,
  booking_reminder: CalendarDays,
};

const colorMap: Record<string, string> = {
  low_stock: "bg-red-50 border-red-100 text-red-700",
  overdue_form: "bg-amber-50 border-amber-100 text-amber-700",
  unanswered_message: "bg-blue-50 border-blue-100 text-blue-700",
  booking_reminder: "bg-purple-50 border-purple-100 text-purple-700",
};

export default function AlertsPage() {
  const { workspaceId } = useWorkspace();
  const supabase = createClient();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  const fetchAlerts = useCallback(async () => {
    let query = supabase
      .from("alerts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (filter === "active") query = query.eq("resolved", false);
    if (filter === "resolved") query = query.eq("resolved", true);

    const { data } = await query;
    setAlerts((data as Alert[]) ?? []);
    setLoading(false);
  }, [supabase, workspaceId, filter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Also generate alerts on page load for current state
  useEffect(() => {
    async function generateAlerts() {
      try {
        await fetch("/api/automations/check-alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspace_id: workspaceId }),
        });
        fetchAlerts();
      } catch {
        // best-effort
      }
    }
    if (workspaceId) generateAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleResolve = async (id: string) => {
    await supabase.from("alerts").update({ resolved: true }).eq("id", id);
    fetchAlerts();
  };

  const handleResolveAll = async () => {
    await supabase
      .from("alerts")
      .update({ resolved: true })
      .eq("workspace_id", workspaceId)
      .eq("resolved", false);
    fetchAlerts();
  };

  const activeCount = alerts.filter((a) => !a.resolved).length;

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
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Bell size={24} /> Alerts
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {activeCount > 0
              ? `${activeCount} active alert${activeCount > 1 ? "s" : ""} need attention`
              : "No active alerts — everything looks good!"}
          </p>
        </div>
        {activeCount > 0 && (
          <button
            onClick={handleResolveAll}
            className="text-sm text-zinc-500 hover:text-zinc-800 border border-zinc-200 rounded-lg px-3 py-1.5"
          >
            Resolve all
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 mb-6 w-fit">
        {(["all", "active", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-400 text-sm">
          {filter === "all" ? "No alerts yet." : `No ${filter} alerts.`}
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = iconMap[alert.type] ?? AlertTriangle;
            const color = colorMap[alert.type] ?? "bg-zinc-50 border-zinc-100 text-zinc-700";

            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-4 flex items-start gap-3 ${
                  alert.resolved ? "opacity-50 bg-zinc-50 border-zinc-100" : color
                }`}
              >
                <Icon size={18} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium">{alert.title}</h3>
                  <p className="text-xs mt-0.5 opacity-75">{alert.message}</p>
                  <p className="text-[10px] mt-1 opacity-50">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {alert.link && (
                    <Link
                      href={alert.link}
                      className="text-xs underline opacity-75 hover:opacity-100"
                    >
                      View
                    </Link>
                  )}
                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="bg-white/80 rounded-lg p-1.5 hover:bg-white transition-colors"
                      title="Mark as resolved"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
