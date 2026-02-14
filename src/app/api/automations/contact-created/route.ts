import { NextResponse } from "next/server";
import { ensureConversation, sendAutoMessage } from "@/lib/automations";

export async function POST(request: Request) {
  try {
    const { workspace_id, contact_id, contact_name, message } = await request.json();

    if (!workspace_id || !contact_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const convId = await ensureConversation(workspace_id, contact_id, "Contact inquiry");

    // Send the customer's message first
    if (message) {
      await sendAutoMessage(workspace_id, contact_id, convId, message, "contact");
    }

    // Send welcome auto-reply
    const welcomeMsg =
      `Hi ${contact_name || "there"}! Thanks for reaching out. ` +
      `We've received your message and a team member will get back to you shortly. ` +
      `Feel free to reply here if you have any additional questions!`;

    await sendAutoMessage(workspace_id, contact_id, convId, welcomeMsg, "admin");

    return NextResponse.json({ ok: true, conversation_id: convId });
  } catch (err) {
    console.error("[contact-created]", err);
    return NextResponse.json({ error: "Automation failed" }, { status: 500 });
  }
}
