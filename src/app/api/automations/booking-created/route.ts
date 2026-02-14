import { NextResponse } from "next/server";
import { onBookingCreated } from "@/lib/automations";

/**
 * POST /api/automations/booking-created
 *
 * Called after a booking is successfully created.
 * Triggers:
 *  - Ensure a conversation exists for the contact
 *  - Send a welcome/confirmation message
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspace_id, contact_id, contact_name, service, date, time } = body;

    if (!workspace_id || !contact_id) {
      return NextResponse.json(
        { error: "workspace_id and contact_id are required" },
        { status: 400 }
      );
    }

    await onBookingCreated(
      workspace_id,
      contact_id,
      contact_name ?? "there",
      service ?? "your service",
      date ?? "TBD",
      time ?? "TBD"
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[automation/booking-created]", err);
    return NextResponse.json(
      { error: "Automation failed" },
      { status: 500 }
    );
  }
}
