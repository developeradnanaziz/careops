import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { to, name, date, time, service } = await req.json();

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      console.log("Email skipped — no GMAIL_USER / GMAIL_APP_PASSWORD set.");
      console.log(`Would send to: ${to}, Name: ${name}, Date: ${date}, Time: ${time}, Service: ${service}`);
      return NextResponse.json({ success: true, emailSent: false, message: "Email skipped (no Gmail credentials)" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #18181b;">Booking Confirmed!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your booking has been confirmed with the following details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Service</strong></td><td style="padding: 8px; border: 1px solid #eee;">${service}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #eee;">${date}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Time</strong></td><td style="padding: 8px; border: 1px solid #eee;">${time}</td></tr>
        </table>
        <p>Thank you for choosing CareOps!</p>
      </div>
    `;

    await transporter.sendMail({
      from: `CareOps <${gmailUser}>`,
      to,
      subject: "Booking Confirmation — CareOps",
      html,
    });

    return NextResponse.json({ success: true, emailSent: true });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ success: false, emailSent: false, error: "Failed to send email" }, { status: 500 });
  }
}
