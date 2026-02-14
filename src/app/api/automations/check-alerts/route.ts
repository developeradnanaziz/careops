import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/automations/check-alerts
 *
 * Scans workspace for conditions that trigger alerts:
 * - Low inventory items
 * - Overdue form submissions
 * - Unanswered messages (conversations with unread > 0 for over 24h)
 *
 * Creates alert rows if they don't already exist (avoids duplicates).
 */
export async function POST(request: Request) {
  try {
    const { workspace_id } = await request.json();
    if (!workspace_id) {
      return NextResponse.json({ error: "Missing workspace_id" }, { status: 400 });
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const created: string[] = [];

    // 1. Low-stock inventory alerts
    const { data: inventory } = await supabase
      .from("inventory")
      .select("id, name, quantity, min_quantity")
      .eq("workspace_id", workspace_id);

    for (const item of inventory ?? []) {
      if (item.quantity <= item.min_quantity) {
        // Check if an unresolved alert already exists for this item
        const { data: existing } = await supabase
          .from("alerts")
          .select("id")
          .eq("workspace_id", workspace_id)
          .eq("type", "low_stock")
          .eq("resolved", false)
          .like("message", `%${item.name}%`)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("alerts").insert({
            workspace_id,
            type: "low_stock",
            title: `Low stock: ${item.name}`,
            message: `${item.name} has ${item.quantity} left (minimum: ${item.min_quantity}).`,
            link: "/dashboard/inventory",
            resolved: false,
          });
          created.push(`low_stock:${item.name}`);
        }
      }
    }

    // 2. Overdue form submissions
    const { data: submissions } = await supabase
      .from("form_submissions")
      .select("id, sent_at, contacts(name), forms(name)")
      .eq("workspace_id", workspace_id)
      .eq("status", "pending");

    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();

    for (const sub of submissions ?? []) {
      if (sub.sent_at < threeDaysAgo) {
        // Mark as overdue
        await supabase
          .from("form_submissions")
          .update({ status: "overdue" })
          .eq("id", sub.id);

        const contactName = (sub.contacts as unknown as { name: string })?.name ?? "Contact";
        const formName = (sub.forms as unknown as { name: string })?.name ?? "Form";

        const { data: existing } = await supabase
          .from("alerts")
          .select("id")
          .eq("workspace_id", workspace_id)
          .eq("type", "overdue_form")
          .eq("resolved", false)
          .like("message", `%${contactName}%${formName}%`)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("alerts").insert({
            workspace_id,
            type: "overdue_form",
            title: `Overdue form: ${formName}`,
            message: `${contactName} hasn't completed "${formName}" (sent ${new Date(sub.sent_at).toLocaleDateString()}).`,
            link: "/dashboard/forms",
            resolved: false,
          });
          created.push(`overdue_form:${sub.id}`);
        }
      }
    }

    // 3. Unanswered messages (open conversations with unread for 24h+)
    const { data: convos } = await supabase
      .from("conversations")
      .select("id, last_message_at, contacts(name)")
      .eq("workspace_id", workspace_id)
      .eq("status", "open")
      .gt("unread_count", 0);

    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

    for (const conv of convos ?? []) {
      if (conv.last_message_at && conv.last_message_at < oneDayAgo) {
        const contactName = (conv.contacts as unknown as { name: string })?.name ?? "Contact";

        const { data: existing } = await supabase
          .from("alerts")
          .select("id")
          .eq("workspace_id", workspace_id)
          .eq("type", "unanswered_message")
          .eq("resolved", false)
          .like("message", `%${contactName}%`)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("alerts").insert({
            workspace_id,
            type: "unanswered_message",
            title: `Unanswered: ${contactName}`,
            message: `${contactName} has been waiting for a reply since ${new Date(conv.last_message_at).toLocaleDateString()}.`,
            link: "/dashboard/inbox",
            resolved: false,
          });
          created.push(`unanswered:${conv.id}`);
        }
      }
    }

    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error("[check-alerts]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
