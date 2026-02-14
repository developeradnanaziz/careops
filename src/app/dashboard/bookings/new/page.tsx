"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/lib/supabase-client";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Contact } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewBookingPage() {
  const { workspaceId } = useWorkspace();
  const supabase = createClient();
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    contact_id: "",
    date: "",
    time: "",
    service: "",
    notes: "",
  });

  const fetchContacts = useCallback(async () => {
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name");
    setContacts((data as Contact[]) ?? []);
  }, [supabase, workspaceId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("bookings").insert({
      workspace_id: workspaceId,
      contact_id: form.contact_id,
      date: form.date,
      time: form.time,
      service: form.service,
      notes: form.notes || null,
      status: "confirmed",
    });

    if (!error) {
      // Trigger automation: create conversation + send welcome message
      const contact = contacts.find((c) => c.id === form.contact_id);
      try {
        await fetch("/api/automations/booking-created", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace_id: workspaceId,
            contact_id: form.contact_id,
            contact_name: contact?.name ?? "there",
            service: form.service,
            date: form.date,
            time: form.time,
          }),
        });
      } catch {
        // automation is best-effort
      }
      router.push("/dashboard/bookings");
    }
    setLoading(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <Link
        href="/dashboard/bookings"
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 mb-6"
      >
        <ArrowLeft size={16} />
        Back to bookings
      </Link>

      <h1 className="text-2xl font-bold text-zinc-900 mb-1">New Booking</h1>
      <p className="text-sm text-zinc-500 mb-6">Create a booking for an existing contact.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Contact</label>
          <select
            name="contact_id"
            value={form.contact_id}
            onChange={handleChange}
            required
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="">Select a contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>

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
            <option value="">Select a service</option>
            <option value="Consultation">Consultation</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Check-up">Check-up</option>
            <option value="Other">Other</option>
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
            placeholder="Optional notes..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating..." : "Create Booking"}
        </button>
      </form>
    </div>
  );
}
