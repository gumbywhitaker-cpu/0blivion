import "server-only";

export type SendEmailResult = { delivered: boolean; reason?: string };

/**
 * Minimal transactional email adapter. Uses Resend's REST API directly (no SDK
 * dependency) when RESEND_API_KEY is configured. Otherwise logs to the server
 * console and reports `delivered: false` so callers can show a graceful
 * fallback instead of pretending the email went out.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:not-configured] To: ${params.to} — ${params.subject}`);
    return { delivered: false, reason: "not_configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Kiwi Job Cash <notifications@kiwijobcash.co.nz>",
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });
    if (!res.ok) {
      console.error("Email send failed:", await res.text());
      return { delivered: false, reason: "provider_error" };
    }
    return { delivered: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return { delivered: false, reason: "provider_error" };
  }
}
