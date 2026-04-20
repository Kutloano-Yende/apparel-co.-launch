import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const buildHtml = (name: string, subject: string, message: string) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#fff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:24px;font-weight:700;letter-spacing:0.1em;margin:0;">APPAREL <span style="font-weight:300;">Co.</span></h1>
    </div>
    <div style="background:#fafafa;padding:32px;margin-bottom:24px;">
      <h2 style="font-size:20px;font-weight:600;margin:0 0 12px 0;">Thanks for reaching out, ${name}!</h2>
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
        We've received your message and our team will get back to you within 1-2 business days.
      </p>
    </div>
    <div style="margin-bottom:24px;">
      <p style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Your message</p>
      ${subject ? `<p style="font-size:14px;color:#333;margin:0 0 8px 0;"><strong>Subject:</strong> ${subject}</p>` : ""}
      <p style="font-size:14px;color:#555;line-height:1.6;white-space:pre-wrap;margin:0;">${message}</p>
    </div>
    <div style="text-align:center;padding-top:24px;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;">APPAREL Co. · Midrand, South Africa</p>
    </div>
  </div>
</body>
</html>`;

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { name, email, subject, message } = await req.json();
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeName = escapeHtml(name);
    const safeSubject = escapeHtml(subject || "");
    const safeMessage = escapeHtml(message);
    const safeEmail = escapeHtml(email);

    const customerHtml = buildHtml(safeName, safeSubject, safeMessage);

    const adminHtml = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#fff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:20px;font-weight:700;letter-spacing:0.1em;margin:0;">APPAREL <span style="font-weight:300;">Co.</span> — New Contact Message</h1>
    </div>
    <div style="background:#fafafa;padding:24px;margin-bottom:16px;">
      <p style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px 0;">From</p>
      <p style="font-size:15px;color:#111;margin:0 0 4px 0;"><strong>${safeName}</strong></p>
      <p style="font-size:14px;color:#555;margin:0;"><a href="mailto:${safeEmail}" style="color:#555;">${safeEmail}</a></p>
    </div>
    ${safeSubject ? `<div style="margin-bottom:16px;"><p style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px 0;">Subject</p><p style="font-size:14px;color:#333;margin:0;">${safeSubject}</p></div>` : ""}
    <div style="margin-bottom:24px;">
      <p style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px 0;">Message</p>
      <p style="font-size:14px;color:#333;line-height:1.6;white-space:pre-wrap;margin:0;">${safeMessage}</p>
    </div>
    <div style="text-align:center;padding-top:20px;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;">Reply directly to this email to respond to ${safeName}.</p>
    </div>
  </div>
</body>
</html>`;

    const sendEmail = (payload: Record<string, unknown>) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

    const [customerRes, adminRes] = await Promise.all([
      sendEmail({
        from: "APPAREL Co. <onboarding@resend.dev>",
        to: [email],
        subject: "We received your message — APPAREL Co.",
        html: customerHtml,
      }),
      sendEmail({
        from: "APPAREL Co. <onboarding@resend.dev>",
        to: ["hello@apparelco.co.za"],
        reply_to: email,
        subject: `New contact message from ${name}${subject ? ` — ${subject}` : ""}`,
        html: adminHtml,
      }),
    ]);

    const customerData = await customerRes.json();
    const adminData = await adminRes.json();
    if (!customerRes.ok) console.error("Customer email failed:", customerData);
    if (!adminRes.ok) console.error("Admin email failed:", adminData);
    if (!customerRes.ok && !adminRes.ok) {
      throw new Error(`Both emails failed. Customer: ${JSON.stringify(customerData)}, Admin: ${JSON.stringify(adminData)}`);
    }

    return new Response(JSON.stringify({ success: true, customer: customerData, admin: adminData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("send-contact-reply error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
