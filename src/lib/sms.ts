/**
 * SMS stub – logs message to console.
 * Replace with Twilio/MessageBird integration for production.
 */
export async function sendSMS(to: string, body: string): Promise<{ ok: boolean }> {
  console.log(`[SMS stub] To: ${to} | Body: ${body}`);

  // If TWILIO env vars are set, attempt real send
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (accountSid && authToken && fromNumber) {
    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
        }
      );
      return { ok: res.ok };
    } catch (err) {
      console.error("[SMS] Twilio send failed:", err);
      return { ok: false };
    }
  }

  // Stub: always returns ok
  return { ok: true };
}
