import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendSMS } from "./sms";

/**
 * Service-level Supabase client for server-side automations.
 * Uses the service-role key when available, otherwise anon key.
 */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, key);
}

/**
 * Find or create a conversation for a given contact within a workspace.
 * Returns the conversation id.
 */
export async function ensureConversation(
  workspaceId: string,
  contactId: string,
  subject?: string
): Promise<string> {
  const supabase = getServiceClient();

  // Try to find existing conversation
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("contact_id", contactId)
    .single();

  if (existing) return existing.id;

  // Create new conversation
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      workspace_id: workspaceId,
      contact_id: contactId,
      subject: subject ?? "New conversation",
      last_message: null,
      unread_count: 0,
      status: "open",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return created!.id;
}

/**
 * Post a system/welcome message into a conversation and update
 * the conversation's last_message fields.
 */
export async function sendAutoMessage(
  workspaceId: string,
  contactId: string,
  conversationId: string,
  content: string,
  sender: "admin" | "contact" = "admin"
): Promise<void> {
  const supabase = getServiceClient();

  await supabase.from("messages").insert({
    workspace_id: workspaceId,
    contact_id: contactId,
    conversation_id: conversationId,
    content,
    sender,
  });

  await supabase
    .from("conversations")
    .update({
      last_message: content,
      last_message_at: new Date().toISOString(),
      unread_count: sender === "contact" ? 1 : 0,
    })
    .eq("id", conversationId);
}

/**
 * Full automation: when a booking is created, ensure a conversation
 * exists for the contact and send a welcome/confirmation message.
 */
export async function onBookingCreated(
  workspaceId: string,
  contactId: string,
  contactName: string,
  service: string,
  date: string,
  time: string
): Promise<void> {
  const convId = await ensureConversation(
    workspaceId,
    contactId,
    `Booking: ${service}`
  );

  const message =
    `Hi ${contactName}! Your booking for "${service}" on ${date} at ${time} ` +
    `has been confirmed. We'll send you a reminder before your appointment. ` +
    `Reply here if you have any questions!`;

  await sendAutoMessage(workspaceId, contactId, convId, message, "admin");

  // SMS stub: send confirmation text if phone available
  const supabase = getServiceClient();
  const { data: contact } = await supabase
    .from("contacts")
    .select("phone")
    .eq("id", contactId)
    .single();
  if (contact?.phone) {
    await sendSMS(
      contact.phone,
      `Hi ${contactName}! Your "${service}" on ${date} at ${time} is confirmed. Reply HELP for assistance.`
    );
  }
}

/**
 * When a staff member replies to a conversation, pause automations
 * for that conversation so the human can take over.
 */
export async function onStaffReply(conversationId: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("conversations")
    .update({ automation_paused: true })
    .eq("id", conversationId);
}

/**
 * Create an alert for low inventory items in a workspace.
 */
export async function createLowStockAlert(
  workspaceId: string,
  itemName: string,
  quantity: number,
  minQuantity: number
): Promise<void> {
  const supabase = getServiceClient();

  // Avoid duplicate unresolved alerts
  const { data: existing } = await supabase
    .from("alerts")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("type", "low_stock")
    .eq("resolved", false)
    .like("message", `%${itemName}%`)
    .limit(1);

  if (existing && existing.length > 0) return;

  await supabase.from("alerts").insert({
    workspace_id: workspaceId,
    type: "low_stock",
    title: `Low stock: ${itemName}`,
    message: `${itemName} has ${quantity} left (minimum: ${minQuantity}).`,
    link: "/dashboard/inventory",
    resolved: false,
  });
}
