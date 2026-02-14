"use client";

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { createClient } from "@/lib/supabase-client";
import { useCallback, useEffect, useState } from "react";
import type { Form, FormSubmission, Contact } from "@/types";
import { Plus, Send, FileText, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";

export default function FormsPage() {
  const { workspaceId } = useWorkspace();
  const supabase = createClient();

  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<(FormSubmission & { contacts?: Contact; forms?: Form })[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"forms" | "submissions">("forms");

  // Form builder state
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderForm, setBuilderForm] = useState({
    name: "",
    description: "",
    fields: [{ id: "f1", label: "", type: "text" as const, required: true, options: [] as string[] }],
  });

  // Send form dialog
  const [sendFormId, setSendFormId] = useState<string | null>(null);
  const [sendContactEmail, setSendContactEmail] = useState("");
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    const [formsRes, subsRes] = await Promise.all([
      supabase
        .from("forms")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false }),
      supabase
        .from("form_submissions")
        .select("*, contacts(*), forms(*)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false }),
    ]);
    setForms((formsRes.data as Form[]) ?? []);
    setSubmissions(
      (subsRes.data as (FormSubmission & { contacts?: Contact; forms?: Form })[]) ?? []
    );
    setLoading(false);
  }, [supabase, workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateForm = async () => {
    if (!builderForm.name.trim()) return;
    const fields = builderForm.fields
      .filter((f) => f.label.trim())
      .map((f, i) => ({ ...f, id: `f${i + 1}` }));

    await supabase.from("forms").insert({
      workspace_id: workspaceId,
      name: builderForm.name,
      description: builderForm.description,
      fields,
    });

    setBuilderForm({
      name: "",
      description: "",
      fields: [{ id: "f1", label: "", type: "text", required: true, options: [] }],
    });
    setShowBuilder(false);
    fetchData();
  };

  const handleDeleteForm = async (id: string) => {
    await supabase.from("form_submissions").delete().eq("form_id", id);
    await supabase.from("forms").delete().eq("id", id);
    fetchData();
  };

  const handleSendForm = async () => {
    if (!sendFormId || !sendContactEmail.trim()) return;
    setSending(true);

    // Look up contact by email
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", sendContactEmail.trim())
      .single();

    if (!contact) {
      alert("Contact not found with that email. Add them to Contacts first.");
      setSending(false);
      return;
    }

    await supabase.from("form_submissions").insert({
      workspace_id: workspaceId,
      form_id: sendFormId,
      contact_id: contact.id,
      status: "pending",
      sent_at: new Date().toISOString(),
    });

    setSendFormId(null);
    setSendContactEmail("");
    setSending(false);
    fetchData();
  };

  const addField = () => {
    setBuilderForm({
      ...builderForm,
      fields: [
        ...builderForm.fields,
        { id: `f${builderForm.fields.length + 1}`, label: "", type: "text", required: false, options: [] },
      ],
    });
  };

  const updateField = (index: number, key: string, value: string | boolean) => {
    const updated = [...builderForm.fields];
    (updated[index] as Record<string, unknown>)[key] = value;
    setBuilderForm({ ...builderForm, fields: updated });
  };

  const removeField = (index: number) => {
    setBuilderForm({ ...builderForm, fields: builderForm.fields.filter((_, i) => i !== index) });
  };

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const overdueCount = submissions.filter((s) => s.status === "overdue").length;
  const completedCount = submissions.filter((s) => s.status === "completed").length;

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
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Forms</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Create intake forms and track submissions
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus size={16} /> New Form
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          <p className="text-xs text-amber-600">Pending</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{overdueCount}</p>
          <p className="text-xs text-red-600">Overdue</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{completedCount}</p>
          <p className="text-xs text-green-600">Completed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => setTab("forms")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "forms" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
          }`}
        >
          Form Templates ({forms.length})
        </button>
        <button
          onClick={() => setTab("submissions")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "submissions" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
          }`}
        >
          Submissions ({submissions.length})
        </button>
      </div>

      {/* Form Builder */}
      {showBuilder && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Create Form Template</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Form Name</label>
              <input
                value={builderForm.name}
                onChange={(e) => setBuilderForm({ ...builderForm, name: e.target.value })}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="e.g., New Patient Intake"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
              <input
                value={builderForm.description}
                onChange={(e) => setBuilderForm({ ...builderForm, description: e.target.value })}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="Describe what this form is for"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Fields</label>
              <div className="space-y-2">
                {builderForm.fields.map((field, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={field.label}
                      onChange={(e) => updateField(i, "label", e.target.value)}
                      placeholder="Field label"
                      className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(i, "type", e.target.value)}
                      className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs text-zinc-500">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(i, "required", e.target.checked)}
                      />
                      Req
                    </label>
                    {builderForm.fields.length > 1 && (
                      <button
                        onClick={() => removeField(i)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addField}
                className="text-xs text-zinc-500 hover:text-zinc-800 mt-2"
              >
                + Add field
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreateForm}
              className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              Create Form
            </button>
            <button
              onClick={() => setShowBuilder(false)}
              className="border border-zinc-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Send Form Dialog */}
      {sendFormId && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Send Form to Contact</h2>
          <div className="flex gap-2">
            <input
              value={sendContactEmail}
              onChange={(e) => setSendContactEmail(e.target.value)}
              placeholder="Contact email address"
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <button
              onClick={handleSendForm}
              disabled={sending}
              className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {sending ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => { setSendFormId(null); setSendContactEmail(""); }}
              className="border border-zinc-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Forms Tab */}
      {tab === "forms" && (
        <>
          {forms.length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-400 text-sm">
              No forms yet. Create your first form template to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {forms.map((f) => (
                <div
                  key={f.id}
                  className="bg-white rounded-xl border border-zinc-200 p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-zinc-100 rounded-lg p-2.5">
                      <FileText size={18} className="text-zinc-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-zinc-900 text-sm">{f.name}</h3>
                      <p className="text-xs text-zinc-500">
                        {f.fields?.length ?? 0} fields
                        {f.description ? ` · ${f.description}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/forms/${f.id}`}
                      target="_blank"
                      className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> Preview
                    </Link>
                    <button
                      onClick={() => setSendFormId(f.id)}
                      className="flex items-center gap-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <Send size={12} /> Send
                    </button>
                    <button
                      onClick={() => handleDeleteForm(f.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Submissions Tab */}
      {tab === "submissions" && (
        <>
          {submissions.length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-400 text-sm">
              No submissions yet. Send a form to a contact to get started.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-zinc-500">
                      <th className="px-5 py-3 font-medium">Contact</th>
                      <th className="px-5 py-3 font-medium">Form</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Sent</th>
                      <th className="px-5 py-3 font-medium">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                        <td className="px-5 py-3 text-zinc-900">
                          {s.contacts?.name ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-zinc-700">
                          {s.forms?.name ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              s.status === "completed"
                                ? "bg-green-50 text-green-700"
                                : s.status === "overdue"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-zinc-500 text-xs">
                          {new Date(s.sent_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-zinc-500 text-xs">
                          {s.completed_at
                            ? new Date(s.completed_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
