import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// --- CORS: restrict to known origins instead of "*" ---
const ALLOWED_ORIGINS = [
  "https://apparel-co-launch.vercel.app",
  "http://localhost:8080",
  "http://localhost:5173",
];
const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin":
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Vary": "Origin",
});

// Used to gate the admin-reply mode (sending email from the brand to a customer).
async function isAdmin(req: Request): Promise<boolean> {
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
  if (!token) return false;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  return !!role;
}

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

const buildAdminReplyHtml = (name: string, subject: string, replyMessage: string, originalMessage: string) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#fff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:24px;font-weight:700;letter-spacing:0.1em;margin:0;">APPAREL <span style="font-weight:300;">Co.</span></h1>
    </div>
    <div style="padding:8px 0 24px 0;">
      <p style="font-size:15px;color:#111;margin:0 0 16px 0;">Hi ${name},</p>
      <p style="font-size:15px;color:#333;line-height:1.7;white-space:pre-wrap;margin:0;">${replyMessage}</p>
    </div>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #eee;">
      <p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px 0;">In reply to your message</p>
      ${subject ? `<p style="font-size:13px;color:#666;margin:0 0 8px 0;"><strong>Subject:</strong> ${subject}</p>` : ""}
      <p style="font-size:13px;color:#888;line-height:1.6;white-space:pre-wrap;margin:0;font-style:italic;">${originalMessage}</p>
    </div>
    <div style="text-align:center;padding-top:24px;margin-top:24px;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;">APPAREL Co. · Midrand, South Africa</p>
    </div>
  </div>
</body>
</html>`;

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const body = await req.json();
    const mode: string = body.mode || "acknowledgement";

    // Authorize the admin-reply mode BEFORE doing anything else, so unauthorized
    // callers always get 403 regardless of email configuration.
    if (mode === "admin-reply" && !(await isAdmin(req))) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const sendEmail = (payload: Record<string, unknown>) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

    // ---------- ADMIN REPLY MODE (admin only — sends mail from the brand) ----------
    if (mode === "admin-reply") {
      const { name, email, subject, replyMessage, originalMessage } = body;
      if (!name || !email || !replyMessage) {
        return new Response(JSON.stringify({ error: "Missing required fields (name, email, replyMessage)" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      if (typeof replyMessage !== "string" || replyMessage.length < 1 || replyMessage.length > 5000) {
        return new Response(JSON.stringify({ error: "replyMessage must be 1-5000 characters" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const html = buildAdminReplyHtml(
        escapeHtml(name),
        escapeHtml(subject || ""),
        escapeHtml(replyMessage),
        escapeHtml(originalMessage || ""),
      );

      const replySubject = subject ? `Re: ${subject}` : "Re: Your message to APPAREL Co.";

      const res = await sendEmail({
        from: "APPAREL Co. <noreply@mail.apparelco.co.za>",
        to: [email],
        reply_to: "hello@apparelco.co.za",
        subject: replySubject,
        html,
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Admin reply email failed:", data);
        return new Response(JSON.stringify({ success: false, error: data }), {
          status: 502,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ---------- ACKNOWLEDGEMENT MODE (public — visitor submits the contact form) ----------
    const { name, email, subject, message } = body;
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    // Basic input bounds to limit abuse of the public endpoint.
    if (String(name).length > 100 || String(email).length > 255 || String(message).length > 5000 || String(subject || "").length > 200) {
      return new Response(JSON.stringify({ error: "Field length limits exceeded" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
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

    const [customerRes, adminRes] = await Promise.all([
      sendEmail({
        from: "APPAREL Co. <noreply@mail.apparelco.co.za>",
        to: [email],
        subject: "We received your message — APPAREL Co.",
        html: customerHtml,
      }),
      sendEmail({
        from: "APPAREL Co. <noreply@mail.apparelco.co.za>",
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
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("send-contact-reply error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
