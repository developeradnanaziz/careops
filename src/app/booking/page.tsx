"use client";

import { createPublicClient } from "@/lib/supabase-public";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Booking() {
  const supabase = createPublicClient();

  // Load the default workspace so contacts/bookings are scoped correctly
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [wsError, setWsError] = useState(false);
  const [services, setServices] = useState<{ name: string }[]>([]);

  useEffect(() => {
    // Check URL param first, then fall back to API
    const params = new URLSearchParams(window.location.search);
    const ws = params.get("workspace");
    if (ws) {
      setWorkspaceId(ws);
    } else {
      fetch("/api/workspace/default")
        .then((r) => r.json())
        .then((d) => {
          if (d.id) setWorkspaceId(d.id);
          else setWsError(true);
        })
        .catch(() => setWsError(true));
    }
  }, []);

  // Load active services from DB
  useEffect(() => {
    if (!workspaceId) return;
    supabase
      .from("services")
      .select("name")
      .eq("workspace_id", workspaceId)
      .eq("active", true)
      .order("name")
      .then(({ data }: { data: any }) => {
        if (data && data.length > 0) {
          setServices(data);
        } else {
          // Fallback if no services configured yet
          setServices([
            { name: "Consultation" },
            { name: "Follow-up" },
            { name: "Check-up" },
            { name: "Other" },
          ]);
        }
      });
  }, [supabase, workspaceId]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    service: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return; // workspace not loaded yet
    setLoading(true);

    // 1. Upsert contact (include workspace_id so it appears in dashboard)
    const { data: contact } = await supabase
      .from("contacts")
      .upsert(
        { name: form.name, email: form.email, phone: form.phone, workspace_id: workspaceId },
        { onConflict: "email" }
      )
      .select()
      .single();

    // 2. Insert booking (include workspace_id so it appears in dashboard)
    const { error } = await supabase.from("bookings").insert({
      workspace_id: workspaceId,
      contact_id: contact?.id,
      date: form.date,
      time: form.time,
      service: form.service,
      notes: form.notes,
      status: "confirmed",
    });

    if (!error) {
      // 3. Send confirmation email
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: form.email,
            name: form.name,
            date: form.date,
            time: form.time,
            service: form.service,
          }),
        });
      } catch {
        // email is best-effort
      }

      // 4. Trigger automation (conversation + welcome message)
      try {
        await fetch("/api/automations/booking-created", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace_id: workspaceId,
            contact_id: contact?.id,
            contact_name: form.name,
            service: form.service,
            date: form.date,
            time: form.time,
          }),
        });
      } catch {
        // automation is best-effort
      }

      setSuccess(true);
      setForm({ name: "", email: "", phone: "", date: "", time: "", service: "", notes: "" });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 mb-4 inline-block">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Book an Appointment</h1>
        <p className="text-zinc-500 text-sm mb-6">Fill in your details to schedule a booking.</p>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-6 text-sm">
            Booking confirmed! A confirmation email has been sent.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
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
              {services.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
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
            disabled={loading || !workspaceId}
            className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Booking..." : !workspaceId ? "Connecting..." : "Confirm Booking"}
          </button>

          {wsError && (
            <p className="text-xs text-red-500 text-center">
              Could not connect to workspace. An admin must sign up first.
            </p>
          )}

          {!workspaceId && !wsError && (
            <p className="text-xs text-zinc-400 text-center">
              Setting up — if this takes too long, please{" "}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="underline hover:text-zinc-600"
              >
                refresh the page
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
