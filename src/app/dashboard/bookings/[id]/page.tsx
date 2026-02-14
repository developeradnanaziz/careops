"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/lib/supabase-client";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Booking, Contact } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { workspaceId } = useWorkspace();
  const supabase = createClient();
  const router = useRouter();

  const [booking, setBooking] = useState<(Booking & { contacts: Contact }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: "",
    service: "",
    status: "",
    notes: "",
  });

  const fetchBooking = useCallback(async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*, contacts(*)")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();

    const b = data as (Booking & { contacts: Contact }) | null;
    setBooking(b);
    if (b) {
      setForm({
        date: b.date,
        time: b.time,
        service: b.service,
        status: b.status,
        notes: b.notes ?? "",
      });
    }
    setLoading(false);
  }, [supabase, id, workspaceId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase
      .from("bookings")
      .update({
        date: form.date,
        time: form.time,
        service: form.service,
        status: form.status,
        notes: form.notes || null,
      })
      .eq("id", id);
    setSaving(false);
    router.push("/dashboard/bookings");
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-zinc-200 rounded" />
          <div className="h-60 bg-zinc-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8">
        <p className="text-zinc-500">Booking not found.</p>
        <Link href="/dashboard/bookings" className="text-sm text-zinc-900 hover:underline mt-2 inline-block">
          Back to bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <Link
        href="/dashboard/bookings"
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 mb-6"
      >
        <ArrowLeft size={16} />
        Back to bookings
      </Link>

      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Edit Booking</h1>
      <p className="text-sm text-zinc-500 mb-6">
        For {booking.contacts?.name} ({booking.contacts?.email})
      </p>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Time</label>
            <input
              name="time"
              type="time"
              value={form.time}
              onChange={handleChange}
              required
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Service</label>
          <select
            name="service"
            value={form.service}
            onChange={handleChange}
            required
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="Consultation">Consultation</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Check-up">Check-up</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No-show</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
