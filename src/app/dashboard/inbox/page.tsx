"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/lib/supabase-client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Inbox as InboxIcon,
  Send,
  Search,
  Archive,
  CheckCircle,
  Circle,
  MessageSquare,
} from "lucide-react";
import type { Conversation, Message, Contact } from "@/types";

export default function InboxPage() {
  const { workspaceId } = useWorkspace();
  const supabase = createClient();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const threadEnd = useRef<HTMLDivElement>(null);

  // ── Fetch conversations ───────────────────────────────────
  const fetchConversations = useCallback(async () => {
    let query = supabase
      .from("conversations")
      .select("*, contacts(*)")
      .eq("workspace_id", workspaceId)
      .order("last_message_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    let results = (data as Conversation[]) ?? [];

    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (c) =>
          (c.contacts as unknown as Contact)?.name?.toLowerCase().includes(s) ||
          (c.contacts as unknown as Contact)?.email?.toLowerCase().includes(s) ||
          c.last_message?.toLowerCase().includes(s)
      );
    }

    setConversations(results);
    setLoading(false);
  }, [supabase, workspaceId, search, filter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Fetch messages for active conversation ────────────────
  const fetchMessages = useCallback(async () => {
    if (!activeConv) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", activeConv.id)
      .order("created_at", { ascending: true });

    setMessages((data as Message[]) ?? []);

    // Mark as read
    if (activeConv.unread_count > 0) {
      await supabase
        .from("conversations")
        .update({ unread_count: 0 })
        .eq("id", activeConv.id);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? { ...c, unread_count: 0 } : c))
      );
    }
  }, [supabase, activeConv]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;
    setSending(true);

    const msg = {
      workspace_id: workspaceId,
      contact_id: activeConv.contact_id,
      conversation_id: activeConv.id,
      content: newMsg.trim(),
      sender: "admin" as const,
    };

    await supabase.from("messages").insert(msg);

    // Update conversation last_message
    await supabase
      .from("conversations")
      .update({
        last_message: newMsg.trim(),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", activeConv.id);

    setNewMsg("");
    setSending(false);
    fetchMessages();
    fetchConversations();
  };

  // ── Toggle conversation status ────────────────────────────
  const toggleStatus = async (conv: Conversation) => {
    const next = conv.status === "open" ? "closed" : "open";
    await supabase.from("conversations").update({ status: next }).eq("id", conv.id);
    fetchConversations();
    if (activeConv?.id === conv.id) {
      setActiveConv({ ...conv, status: next });
    }
  };

  // ── Helpers ───────────────────────────────────────────────
  const contactOf = (c: Conversation) => c.contacts as unknown as Contact;

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  // ── UI ────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] lg:h-screen overflow-hidden">
      {/* ── Left: Conversation List ─────────────────────────── */}
      <div className={`w-full lg:w-80 xl:w-96 border-r border-zinc-200 flex-col bg-white ${activeConv ? "hidden lg:flex" : "flex"}`}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <InboxIcon size={20} />
              Inbox
            </h1>
            <span className="text-xs text-zinc-500">
              {conversations.filter((c) => c.unread_count > 0).length} unread
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1">
            {(["all", "open", "closed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation items */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-zinc-400">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare size={32} className="mx-auto text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-400">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const contact = contactOf(conv);
              const isActive = activeConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-left p-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${
                    isActive ? "bg-zinc-50 border-l-2 border-l-zinc-900" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {conv.unread_count > 0 && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-zinc-900 truncate">
                          {contact?.name ?? "Unknown"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {contact?.email ?? ""}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-1">
                        {conv.last_message ?? "No messages yet"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-zinc-400">
                        {timeAgo(conv.last_message_at)}
                      </span>
                      {conv.unread_count > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          conv.status === "open"
                            ? "bg-green-50 text-green-600"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {conv.status}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: Message Thread ───────────────────────────── */}
      <div className={`flex-1 flex-col bg-zinc-50 ${!activeConv ? "hidden lg:flex" : "flex"}`}>
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <InboxIcon size={48} className="mx-auto text-zinc-300 mb-3" />
              <p className="text-zinc-400 text-sm">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="bg-white border-b border-zinc-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConv(null)}
                  className="lg:hidden text-zinc-500 hover:text-zinc-800 -ml-1"
                >
                  ←
                </button>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">
                    {contactOf(activeConv)?.name ?? "Unknown"}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {contactOf(activeConv)?.email ?? ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStatus(activeConv)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                >
                  {activeConv.status === "open" ? (
                    <>
                      <CheckCircle size={12} /> Close
                    </>
                  ) : (
                    <>
                      <Circle size={12} /> Reopen
                    </>
                  )}
                </button>
                <button
                  onClick={async () => {
                    await supabase
                      .from("conversations")
                      .update({ status: "archived" })
                      .eq("id", activeConv.id);
                    setActiveConv(null);
                    fetchConversations();
                  }}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-500"
                >
                  <Archive size={12} /> Archive
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-zinc-400 mt-8">
                  No messages in this conversation yet.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        m.sender === "admin"
                          ? "bg-zinc-900 text-white rounded-br-md"
                          : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-md"
                      }`}
                    >
                      <p>{m.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          m.sender === "admin" ? "text-zinc-400" : "text-zinc-400"
                        }`}
                      >
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={threadEnd} />
            </div>

            {/* Compose */}
            <form
              onSubmit={handleSend}
              className="bg-white border-t border-zinc-200 p-4 flex gap-2"
            >
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sending || !newMsg.trim()}
                className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <Send size={14} />
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
