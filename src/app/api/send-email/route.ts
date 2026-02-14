import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { to, name, date, time, service } = await req.json();

    // Using Supabase Edge Function or any SMTP relay.
    // For simplicity, we use a basic fetch to a mail service.
    // Replace with your preferred email provider (Resend, SendGrid, etc.)

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.log("Email skipped — no RESEND_API_KEY set.");
      console.log(`Would send to: ${to}, Name: ${name}, Date: ${date}, Time: ${time}, Service: ${service}`);
      return NextResponse.json({ success: true, emailSent: false, message: "Email skipped (no API key)" });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CareOps <onboarding@resend.dev>",
        to,
        subject: "Booking Confirmation",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Booking Confirmed!</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Your booking has been confirmed with the following details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Service</strong></td><td style="padding: 8px; border: 1px solid #eee;">${service}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #eee;">${date}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Time</strong></td><td style="padding: 8px; border: 1px solid #eee;">${time}</td></tr>
            </table>
            <p>Thank you for choosing CareOps!</p>
          </div>
        `,
      }),
    });

    const data = await res.json();
    return NextResponse.json({ success: true, emailSent: true, data });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
  }
}
