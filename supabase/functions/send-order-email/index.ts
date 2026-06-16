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

// Only signed-in admins may trigger customer order emails.
async function requireAdmin(req: Request): Promise<{ ok: boolean; status?: number; msg?: string }> {
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
  if (!token) return { ok: false, status: 401, msg: "Missing authorization token" };
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { ok: false, status: 401, msg: "Invalid or expired session" };
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) return { ok: false, status: 403, msg: "Admin access required" };
  return { ok: true };
}

const statusMessages: Record<string, { subject: string; heading: string; body: string }> = {
  confirmed: {
    subject: "Order Confirmed — APPAREL Co.",
    heading: "Your order has been confirmed!",
    body: "We've received your order and it's being prepared. You'll receive another update when it ships.",
  },
  processing: {
    subject: "Order Processing — APPAREL Co.",
    heading: "Your order is being processed",
    body: "We're preparing your items with care. You'll hear from us again once everything is packed and ready to ship.",
  },
  shipped: {
    subject: "Order Shipped — APPAREL Co.",
    heading: "Your order is on its way!",
    body: "Great news — your order has been shipped and is on its way to you. Keep an eye on your inbox for tracking updates.",
  },
  delivered: {
    subject: "Order Delivered — APPAREL Co.",
    heading: "Your order has been delivered",
    body: "Your order has been delivered! We hope you love your new gear. Thank you for shopping with APPAREL Co.",
  },
  cancelled: {
    subject: "Order Cancelled — APPAREL Co.",
    heading: "Your order has been cancelled",
    body: "Your order has been cancelled. If you didn't request this, please contact us and we'll help sort things out.",
  },
};

const escapeHtml = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const buildEmailHtml = (heading: string, body: string, orderId: string, items: any[]) => {
  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
        <strong style="font-family: 'Helvetica Neue', sans-serif; font-size: 14px;">${escapeHtml(item.product_name)}</strong><br/>
        <span style="color: #666; font-size: 13px;">Size: ${escapeHtml(item.size)} · Color: ${escapeHtml(item.color)} · Qty: ${Number(item.quantity) || 0}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-family: 'Helvetica Neue', sans-serif; font-size: 14px;">
        R ${((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString()}
      </td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; letter-spacing: 0.1em; margin: 0;">APPAREL <span style="font-weight: 300;">Co.</span></h1>
        </div>
        <div style="background: #fafafa; padding: 32px; margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 12px 0;">${heading}</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0;">${body}</p>
        </div>
        <div style="margin-bottom: 24px;">
          <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Order #${escapeHtml(orderId.slice(0, 8).toUpperCase())}</p>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
          </table>
        </div>
        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">Thank you for shopping with APPAREL Co.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    // Authorize: only admins can send order status emails.
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ success: false, error: auth.msg }), {
        status: auth.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, status, orderId, items } = await req.json();

    if (!email || !status || !orderId) {
      throw new Error("Missing required fields: email, status, orderId");
    }

    const template = statusMessages[status];
    if (!template) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: `No email template for status: ${status}` }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const html = buildEmailHtml(template.heading, template.body, orderId, items || []);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "APPAREL Co. <onboarding@resend.dev>",
        to: [email],
        subject: template.subject,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(`Resend API error [${resendResponse.status}]: ${JSON.stringify(resendData)}`);
    }

    return new Response(JSON.stringify({ success: true, data: resendData }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending order email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
