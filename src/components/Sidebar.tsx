"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Inbox,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
  FileText,
  Bell,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox, badge: true },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard/services", label: "Services", icon: Briefcase },
  { href: "/dashboard/forms", label: "Forms", icon: FileText },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell, alertBadge: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  workspaceName,
  userEmail,
}: {
  workspaceName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  // Fetch unread conversation count for badge
  const fetchUnread = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select("unread_count")
      .gt("unread_count", 0);
    const total = (data ?? []).reduce(
      (sum: number, c: { unread_count: number }) => sum + c.unread_count,
      0
    );
    setUnreadCount(total);

    // Also fetch active alert count
    const { count } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("resolved", false);
    setAlertCount(count ?? 0);
  }, [supabase]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Workspace header */}
      <div className="px-4 py-5 border-b border-zinc-200">
        <h1 className="text-sm font-bold text-zinc-900 truncate">{workspaceName}</h1>
        <p className="text-xs text-zinc-500 truncate mt-0.5">{userEmail}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, badge, alertBadge }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(href)
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {badge && unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            {alertBadge && alertCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-zinc-200">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors w-full"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white border border-zinc-200 rounded-lg p-2 shadow-sm"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-white border-r border-zinc-200 flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
