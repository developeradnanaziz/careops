"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/lib/supabase-client";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Mail, Phone, CalendarDays } from "lucide-react";
import type { Contact, Booking } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { workspaceId } = useWorkspace();
  const supabase = createClient();

  const [contact, setContact] = useState<Contact | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContact = useCallback(async () => {
    const [contactRes, bookingsRes] = await Promise.all([
      supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .single(),
      supabase
        .from("bookings")
        .select("*")
        .eq("contact_id", id)
        .eq("workspace_id", workspaceId)
        .order("date", { ascending: false }),
    ]);

    setContact(contactRes.data as Contact | null);
    setBookings((bookingsRes.data as Booking[]) ?? []);
    setLoading(false);
  }, [supabase, id, workspaceId]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-zinc-200 rounded" />
          <div className="h-40 bg-zinc-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8">
        <p className="text-zinc-500">Contact not found.</p>
        <Link href="/dashboard/contacts" className="text-sm text-zinc-900 hover:underline mt-2 inline-block">
          Back to contacts
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <Link
        href="/dashboard/contacts"
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 mb-6"
      >
        <ArrowLeft size={16} />
        Back to contacts
      </Link>

      {/* Contact info */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 text-white flex items-center justify-center text-lg font-bold">
            {contact.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">{contact.name}</h1>
            <p className="text-sm text-zinc-500">
              Added {new Date(contact.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-zinc-400" />
            <span className="text-zinc-700">{contact.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone size={16} className="text-zinc-400" />
            <span className="text-zinc-700">{contact.phone || "No phone"}</span>
          </div>
        </div>
      </div>

      {/* Booking history */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
          <CalendarDays size={16} className="text-zinc-500" />
          <h2 className="font-semibold text-zinc-900">Booking History</h2>
          <span className="text-xs text-zinc-500 ml-auto">{bookings.length} bookings</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-zinc-500">
              <th className="px-5 py-3 font-medium">Service</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">
                  No bookings for this contact.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="border-b border-zinc-50 hover:bg-zinc-50">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
