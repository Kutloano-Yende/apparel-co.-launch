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

    const html = buildHtml(escapeHtml(name), escapeHtml(subject || ""), escapeHtml(message));

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "APPAREL Co. <onboarding@resend.dev>",
        to: [email],
        subject: "We received your message — APPAREL Co.",
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Resend error [${res.status}]: ${JSON.stringify(data)}`);

    return new Response(JSON.stringify({ success: true, data }), {
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
