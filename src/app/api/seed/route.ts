import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * GET /api/seed
 *
 * Populates the current user's workspace with demo data:
 * - 6 contacts
 * - 8 bookings
 * - 4 conversations with messages
 * - 10 inventory items (some low-stock)
 *
 * Requires the user to be authenticated.
 */
export async function GET() {
  try {
    // Get the authenticated user's workspace
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // read-only in route handler
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get workspace
    const { data: workspace } = await supabaseAuth
      .from("workspaces")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const workspaceId = workspace.id;

    // Use service role for seeding if available, otherwise anon
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // ── 0. Clean existing data (makes seed idempotent / safe to re-run) ──
    await supabase.from("messages").delete().eq("workspace_id", workspaceId);
    await supabase.from("conversations").delete().eq("workspace_id", workspaceId);
    await supabase.from("form_submissions").delete().eq("workspace_id", workspaceId);
    await supabase.from("forms").delete().eq("workspace_id", workspaceId);
    await supabase.from("alerts").delete().eq("workspace_id", workspaceId);
    await supabase.from("bookings").delete().eq("workspace_id", workspaceId);
    await supabase.from("inventory").delete().eq("workspace_id", workspaceId);
    await supabase.from("services").delete().eq("workspace_id", workspaceId);
    await supabase.from("contacts").delete().eq("workspace_id", workspaceId);

    // ── 1. Contacts ────────────────────────────────────────
    const contactsData = [
      { name: "Sarah Johnson", email: "sarah.j@example.com", phone: "+1-555-0101" },
      { name: "Michael Chen", email: "m.chen@example.com", phone: "+1-555-0102" },
      { name: "Emily Rodriguez", email: "emily.r@example.com", phone: "+1-555-0103" },
      { name: "James Wilson", email: "james.w@example.com", phone: "+1-555-0104" },
      { name: "Priya Patel", email: "priya.p@example.com", phone: "+1-555-0105" },
      { name: "David Kim", email: "david.k@example.com", phone: "+1-555-0106" },
    ];

    const { data: contacts } = await supabase
      .from("contacts")
      .insert(
        contactsData.map((c) => ({ ...c, workspace_id: workspaceId }))
      )
      .select();

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: "Failed to seed contacts" }, { status: 500 });
    }

    // ── 2. Bookings ────────────────────────────────────────
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const bookingsData = [
      { contact: 0, service: "Consultation", date: fmt(today), time: "09:00", status: "confirmed" },
      { contact: 1, service: "Follow-up", date: fmt(today), time: "10:30", status: "confirmed" },
      { contact: 2, service: "Check-up", date: fmt(today), time: "14:00", status: "completed" },
      {
        contact: 0,
        service: "Follow-up",
        date: fmt(new Date(today.getTime() + 86400000)),
        time: "11:00",
        status: "confirmed",
      },
      {
        contact: 3,
        service: "Consultation",
        date: fmt(new Date(today.getTime() + 86400000)),
        time: "15:30",
        status: "confirmed",
      },
      {
        contact: 4,
        service: "Check-up",
        date: fmt(new Date(today.getTime() - 86400000)),
        time: "09:30",
        status: "completed",
      },
      {
        contact: 5,
        service: "Consultation",
        date: fmt(new Date(today.getTime() - 2 * 86400000)),
        time: "13:00",
        status: "cancelled",
      },
      {
        contact: 2,
        service: "Follow-up",
        date: fmt(new Date(today.getTime() - 3 * 86400000)),
        time: "10:00",
        status: "no-show",
      },
    ];

    await supabase.from("bookings").insert(
      bookingsData.map((b) => ({
        workspace_id: workspaceId,
        contact_id: contacts[b.contact].id,
        service: b.service,
        date: b.date,
        time: b.time,
        status: b.status,
      }))
    );

    // ── 3. Conversations + Messages ────────────────────────
    const convContacts = [0, 1, 2, 4]; // Sarah, Michael, Emily, Priya

    for (const ci of convContacts) {
      const contact = contacts[ci];

      // Insert conversation (table was cleared above, so no conflict)
      const { data: conv } = await supabase
        .from("conversations")
        .insert(
          {
            workspace_id: workspaceId,
            contact_id: contact.id,
            subject: `Chat with ${contact.name}`,
            status: ci === 2 ? "closed" : "open",
            last_message_at: new Date().toISOString(),
            unread_count: ci === 1 ? 2 : ci === 4 ? 1 : 0,
          }
        )
        .select()
        .single();

      if (!conv) continue;

      // Messages for each conversation
      const messageTemplates: Record<number, { content: string; sender: "admin" | "contact" }[]> = {
        0: [
          { content: `Hi ${contact.name}! Your booking for "Consultation" today at 09:00 has been confirmed.`, sender: "admin" },
          { content: "Thank you! Is there anything I should prepare beforehand?", sender: "contact" },
          { content: "Just bring your ID and any previous medical records if available. See you soon!", sender: "admin" },
        ],
        1: [
          { content: `Hi ${contact.name}! Your follow-up appointment is scheduled for today at 10:30.`, sender: "admin" },
          { content: "Great, I'll be there. Can I also ask about my test results?", sender: "contact" },
          { content: "Of course! Dr. Smith will go over everything with you during the appointment.", sender: "admin" },
          { content: "Do I need to fast before the visit?", sender: "contact" },
          { content: "No fasting required for a follow-up. Just come as you are!", sender: "contact" },
        ],
        2: [
          { content: `Hi ${contact.name}! Your check-up has been completed. Here's a summary of the visit.`, sender: "admin" },
          { content: "Thanks for the thorough check-up. Everything looks good?", sender: "contact" },
          { content: "All results are normal! We'll schedule your next check-up in 6 months.", sender: "admin" },
          { content: "Perfect, thank you!", sender: "contact" },
        ],
        4: [
          { content: `Welcome ${contact.name}! Thanks for booking with us. Your check-up was yesterday at 09:30.`, sender: "admin" },
          { content: "Hi! I had a great experience. When can I get my lab results?", sender: "contact" },
        ],
      };

      const msgs = messageTemplates[ci] ?? [];
      const lastMsg = msgs[msgs.length - 1];

      for (let i = 0; i < msgs.length; i++) {
        await supabase.from("messages").insert({
          workspace_id: workspaceId,
          contact_id: contact.id,
          conversation_id: conv.id,
          content: msgs[i].content,
          sender: msgs[i].sender,
          created_at: new Date(Date.now() - (msgs.length - i) * 60000).toISOString(),
        });
      }

      // Update last message
      if (lastMsg) {
        await supabase
          .from("conversations")
          .update({ last_message: lastMsg.content })
          .eq("id", conv.id);
      }
    }

    // ── 4. Inventory ───────────────────────────────────────
    const inventoryData = [
      { name: "Disposable Gloves (L)", category: "PPE", quantity: 150, min_quantity: 50, unit: "boxes", cost_per_unit: 8.5 },
      { name: "Face Masks (N95)", category: "PPE", quantity: 3, min_quantity: 20, unit: "boxes", cost_per_unit: 15.0 },
      { name: "Hand Sanitizer", category: "Consumables", quantity: 24, min_quantity: 10, unit: "liters", cost_per_unit: 4.5 },
      { name: "Blood Pressure Monitor", category: "Equipment", quantity: 5, min_quantity: 2, unit: "pcs", cost_per_unit: 89.99 },
      { name: "Digital Thermometer", category: "Equipment", quantity: 8, min_quantity: 3, unit: "pcs", cost_per_unit: 24.99 },
      { name: "Bandages (Assorted)", category: "Medical Supplies", quantity: 2, min_quantity: 15, unit: "packs", cost_per_unit: 6.0 },
      { name: "Gauze Pads", category: "Medical Supplies", quantity: 45, min_quantity: 20, unit: "packs", cost_per_unit: 3.5 },
      { name: "Printer Paper", category: "Office Supplies", quantity: 4, min_quantity: 5, unit: "packs", cost_per_unit: 12.0 },
      { name: "Alcohol Swabs", category: "Consumables", quantity: 200, min_quantity: 50, unit: "pcs", cost_per_unit: 0.15 },
      { name: "Examination Table Paper", category: "Medical Supplies", quantity: 1, min_quantity: 5, unit: "rolls", cost_per_unit: 18.0 },
    ];

    await supabase.from("inventory").insert(
      inventoryData.map((item) => ({
        ...item,
        workspace_id: workspaceId,
      }))
    );

    // ── 5. Services ────────────────────────────────────────
    const servicesData = [
      { name: "Consultation", description: "Initial assessment and care plan", duration_minutes: 60, price: 150, active: true },
      { name: "Follow-up", description: "Follow-up visit to review progress", duration_minutes: 30, price: 75, active: true },
      { name: "Check-up", description: "Routine health check-up", duration_minutes: 45, price: 120, active: true },
      { name: "Therapy Session", description: "One-on-one therapy session", duration_minutes: 50, price: 130, active: true },
      { name: "Lab Work", description: "Blood tests and diagnostics", duration_minutes: 15, price: 60, active: false },
    ];

    await supabase.from("services").insert(
      servicesData.map((s) => ({ ...s, workspace_id: workspaceId }))
    );

    // ── 6. Forms ───────────────────────────────────────────
    const formsData = [
      {
        name: "New Patient Intake",
        description: "Collect basic info from new patients",
        fields: [
          { id: "f1", label: "Full Name", type: "text", required: true },
          { id: "f2", label: "Date of Birth", type: "text", required: true },
          { id: "f3", label: "Insurance Provider", type: "text", required: false },
          { id: "f4", label: "Allergies", type: "textarea", required: true },
          { id: "f5", label: "Current Medications", type: "textarea", required: false },
          { id: "f6", label: "I agree to the privacy policy", type: "checkbox", required: true },
        ],
      },
      {
        name: "Post-Visit Feedback",
        description: "Gather feedback after appointments",
        fields: [
          { id: "f1", label: "How was your visit?", type: "textarea", required: true },
          { id: "f2", label: "Would you recommend us?", type: "checkbox", required: false },
          { id: "f3", label: "Additional Comments", type: "textarea", required: false },
        ],
      },
    ];

    const { data: forms } = await supabase
      .from("forms")
      .insert(formsData.map((f) => ({ ...f, workspace_id: workspaceId })))
      .select();

    // ── 7. Form Submissions ────────────────────────────────
    if (forms && forms.length > 0) {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString();

      const submissionsData = [
        {
          form_id: forms[0].id,
          contact_id: contacts[0].id,
          status: "completed",
          sent_at: fiveDaysAgo,
          completed_at: threeDaysAgo,
          data: { f1: "Sarah Johnson", f2: "1990-05-15", f3: "Aetna", f4: "None", f5: "Vitamin D", f6: true },
        },
        {
          form_id: forms[0].id,
          contact_id: contacts[1].id,
          status: "pending",
          sent_at: new Date().toISOString(),
          completed_at: null,
          data: null,
        },
        {
          form_id: forms[1].id,
          contact_id: contacts[2].id,
          status: "completed",
          sent_at: threeDaysAgo,
          completed_at: new Date().toISOString(),
          data: { f1: "Excellent visit, very professional!", f2: true, f3: "" },
        },
        {
          form_id: forms[0].id,
          contact_id: contacts[3].id,
          status: "overdue",
          sent_at: fiveDaysAgo,
          completed_at: null,
          data: null,
        },
      ];

      await supabase.from("form_submissions").insert(
        submissionsData.map((s) => ({ ...s, workspace_id: workspaceId }))
      );
    }

    // ── 8. Alerts ──────────────────────────────────────────
    const alertsData = [
      {
        type: "low_stock",
        title: "Low stock: Face Masks (N95)",
        message: "Face Masks (N95) has 3 left (minimum: 20).",
        link: "/dashboard/inventory",
        resolved: false,
      },
      {
        type: "low_stock",
        title: "Low stock: Bandages (Assorted)",
        message: "Bandages (Assorted) has 2 left (minimum: 15).",
        link: "/dashboard/inventory",
        resolved: false,
      },
      {
        type: "overdue_form",
        title: "Overdue form: New Patient Intake",
        message: "James Wilson hasn't completed \"New Patient Intake\" (sent 5 days ago).",
        link: "/dashboard/forms",
        resolved: false,
      },
      {
        type: "unanswered_message",
        title: "Unanswered: Priya Patel",
        message: "Priya Patel has been waiting for a reply about lab results.",
        link: "/dashboard/inbox",
        resolved: false,
      },
      {
        type: "booking_reminder",
        title: "Upcoming: Sarah Johnson",
        message: "Sarah Johnson has a Follow-up tomorrow at 11:00.",
        link: "/dashboard/bookings",
        resolved: true,
      },
    ];

    await supabase.from("alerts").insert(
      alertsData.map((a) => ({ ...a, workspace_id: workspaceId }))
    );

    return NextResponse.json({
      ok: true,
      seeded: {
        contacts: contacts.length,
        bookings: bookingsData.length,
        conversations: convContacts.length,
        inventory: inventoryData.length,
        services: servicesData.length,
        forms: formsData.length,
        form_submissions: forms ? 4 : 0,
        alerts: alertsData.length,
      },
    });
  } catch (err) {
    console.error("[seed]", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
