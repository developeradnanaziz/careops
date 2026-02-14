"use client";

import { createPublicClient } from "@/lib/supabase-public";
import { useState, useEffect, use } from "react";
import type { Form, FormField } from "@/types";
import Link from "next/link";

export default function FormSubmitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createPublicClient();

  const [form, setForm] = useState<Form | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Load the form template
      const { data: formData } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .single();

      if (!formData) {
        setError("Form not found.");
        setLoading(false);
        return;
      }
      setForm(formData as Form);

      // Check URL for submission context
      const params = new URLSearchParams(window.location.search);
      const sid = params.get("submission");
      const cid = params.get("contact");
      if (sid) setSubmissionId(sid);
      if (cid) setContactId(cid);

      // Initialize default values
      const defaults: Record<string, string | boolean> = {};
      ((formData.fields as FormField[]) ?? []).forEach((f) => {
        defaults[f.id] = f.type === "checkbox" ? false : "";
      });
      setValues(defaults);
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (submissionId) {
      // Update existing submission
      await supabase
        .from("form_submissions")
        .update({
          status: "completed",
          data: values,
          completed_at: new Date().toISOString(),
        })
        .eq("id", submissionId);
    } else if (contactId) {
      // Create new submission
      await supabase.from("form_submissions").insert({
        workspace_id: form!.workspace_id,
        form_id: id,
        contact_id: contactId,
        status: "completed",
        data: values,
        sent_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }

    setDone(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading form...</div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">{error || "Form not found."}</p>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-50 py-12 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-4 text-sm">
            Thank you! Your form has been submitted successfully.
          </div>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 underline">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  const fields = (form.fields as FormField[]) ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">{form.name}</h1>
        {form.description && (
          <p className="text-zinc-500 text-sm mb-6">{form.description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.id}>
              {field.type === "checkbox" ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={values[field.id] as boolean}
                    onChange={(e) =>
                      setValues({ ...values, [field.id]: e.target.checked })
                    }
                  />
                  <span className="text-sm text-zinc-700">{field.label}</span>
                  {field.required && <span className="text-red-400 text-xs">*</span>}
                </label>
              ) : (
                <>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={values[field.id] as string}
                      onChange={(e) =>
                        setValues({ ...values, [field.id]: e.target.value })
                      }
                      required={field.required}
                      rows={3}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={values[field.id] as string}
                      onChange={(e) =>
                        setValues({ ...values, [field.id]: e.target.value })
                      }
                      required={field.required}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="">Select...</option>
                      {(field.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={values[field.id] as string}
                      onChange={(e) =>
                        setValues({ ...values, [field.id]: e.target.value })
                      }
                      required={field.required}
                      className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  )}
                </>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Form"}
          </button>
        </form>
      </div>
    </div>
  );
}
