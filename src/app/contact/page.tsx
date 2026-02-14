"use client";

import { createPublicClient } from "@/lib/supabase-public";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ContactPage() {
  const supabase = createPublicClient();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [wsError, setWsError] = useState(false);

  useEffect(() => {
    fetch("/api/workspace/default")
      .then((r) => r.json())
      .then((d) => {
        if (d.id) setWorkspaceId(d.id);
        else setWsError(true);
      })
      .catch(() => setWsError(true));
  }, []);

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setLoading(true);

    // 1. Upsert contact
    const { data: contact } = await supabase
      .from("contacts")
      .upsert(
        { name: form.name, email: form.email, phone: form.phone, workspace_id: workspaceId },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (contact) {
      // 2. Trigger welcome automation (creates conversation + welcome message)
      try {
        await fetch("/api/automations/contact-created", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace_id: workspaceId,
            contact_id: contact.id,
            contact_name: form.name,
            message: form.message,
          }),
        });
      } catch {
        // best-effort
      }

      setSuccess(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 mb-4 inline-block">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Contact Us</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Send us a message and we&apos;ll get back to you shortly.
        </p>

        {success ? (
          <div className="text-center py-8">
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-4 text-sm">
              Thank you! Your message has been received. We&apos;ll be in touch soon.
            </div>
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-800 underline"
            >
              Return to homepage
            </Link>
          </div>
        ) : (
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

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !workspaceId}
              className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : !workspaceId ? "Connecting..." : "Send Message"}
            </button>

            {wsError && (
              <p className="text-xs text-red-500 text-center">
                Could not connect. An admin must sign up first.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
