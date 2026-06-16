import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://apparel-co-launch.vercel.app",
  "http://localhost:8080",
  "http://localhost:5173",
];
const makeCors = (origin: string | null) => ({
  "Access-Control-Allow-Origin":
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Vary": "Origin",
});

serve(async (req) => {
  const cors = makeCors(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) throw new Error("Missing session_id");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Retrieve the checkout session with line items
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items"],
    });

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { headers: { ...cors, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if order already exists for this session
    const { data: existingOrder } = await supabaseClient
      .from("orders")
      .select("*, order_items(*)")
      .eq("stripe_payment_intent_id", session.payment_intent as string)
      .maybeSingle();

    if (existingOrder) {
      return new Response(
        JSON.stringify({ order: existingOrder }),
        { headers: { ...cors, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Parse shipping address from metadata
    let shippingAddress = {};
    try {
      shippingAddress = JSON.parse(session.metadata?.shipping_address || "{}");
    } catch { /* ignore */ }

    // Get user ID if authenticated
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userId = data.user?.id || null;
    }

    // Calculate totals
    const totalAmount = (session.amount_total || 0) / 100;
    
    // Find shipping line item
    let shippingCost = 0;
    const lineItems = session.line_items?.data || [];
    const productItems = lineItems.filter(
      (item: any) => item.description !== "Standard delivery"
    );
    const shippingItem = lineItems.find(
      (item: any) => item.description === "Standard delivery"
    );
    if (shippingItem) {
      shippingCost = (shippingItem.amount_total || 0) / 100;
    }

    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        user_id: userId,
        email: session.customer_email || session.customer_details?.email || "",
        total_amount: totalAmount,
        shipping_cost: shippingCost,
        status: "processing",
        shipping_address: shippingAddress,
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items from line items (exclude shipping)
    const orderItems = productItems.map((item: any) => {
      const desc = item.description || "";
      const sizeMatch = desc.match(/Size:\s*([^/]+)/);
      const colorMatch = desc.match(/Color:\s*(.+)/);

      return {
        order_id: order.id,
        product_id: "stripe-product",
        product_name: item.description?.split(" - ")[0] || item.description || "Product",
        product_image: "",
        size: sizeMatch ? sizeMatch[1].trim() : "N/A",
        color: colorMatch ? colorMatch[1].trim() : "N/A",
        quantity: item.quantity || 1,
        price: (item.amount_total || 0) / 100 / (item.quantity || 1),
      };
    });

    let savedItems: any[] = [];
    if (orderItems.length > 0) {
      const { data: items, error: itemsError } = await supabaseClient
        .from("order_items")
        .insert(orderItems)
        .select();
      if (itemsError) console.error("Error saving order items:", itemsError);
      savedItems = items || [];
    }

    // === Admin notification + email alert (fire-and-forget; do not block order response) ===
    try {
      const itemCount = savedItems.reduce(
        (sum: number, it: any) => sum + (it.quantity || 0),
        0,
      );
      const customerEmail =
        session.customer_email || session.customer_details?.email || "unknown";
      const orderShortId = order.id.slice(0, 8).toUpperCase();
      const formattedTotal = `R ${totalAmount.toLocaleString("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

      // 1. In-app realtime notification
      await supabaseClient.from("admin_notifications").insert({
        type: "new_order",
        title: `New paid order · ${formattedTotal}`,
        message: `${itemCount} item${itemCount === 1 ? "" : "s"} from ${customerEmail} (#${orderShortId})`,
        order_id: order.id,
        metadata: {
          order_id: order.id,
          email: customerEmail,
          total_amount: totalAmount,
          item_count: itemCount,
          stripe_payment_intent_id: session.payment_intent,
        },
      });

      // 2. Email alert to admin
      const ADMIN_ALERT_EMAIL = Deno.env.get("ADMIN_ALERT_EMAIL");
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (ADMIN_ALERT_EMAIL && RESEND_API_KEY) {
        const itemsHtml = savedItems
          .map(
            (it: any) => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eee;font-family:Helvetica,Arial,sans-serif;font-size:14px;">
                  <strong>${it.product_name}</strong><br/>
                  <span style="color:#666;font-size:13px;">Size: ${it.size} · Color: ${it.color} · Qty: ${it.quantity}</span>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-family:Helvetica,Arial,sans-serif;font-size:14px;">
                  R ${(it.price * it.quantity).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                </td>
              </tr>`,
          )
          .join("");

        const adminHtml = `
          <!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Helvetica,Arial,sans-serif;">
            <div style="max-width:600px;margin:0 auto;padding:32px 20px;background:#fff;">
              <h1 style="font-size:20px;letter-spacing:0.1em;margin:0 0 24px;">APPAREL <span style="font-weight:300;">Co.</span> · Admin Alert</h1>
              <div style="background:#000;color:#fff;padding:24px;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;opacity:0.6;">New Paid Order</p>
                <p style="margin:0;font-size:24px;font-weight:600;">${formattedTotal}</p>
                <p style="margin:8px 0 0;font-size:13px;opacity:0.8;">Order #${orderShortId}</p>
              </div>
              <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <tr><td style="padding:6px 0;color:#666;font-size:13px;">Customer</td><td style="text-align:right;font-size:13px;">${customerEmail}</td></tr>
                <tr><td style="padding:6px 0;color:#666;font-size:13px;">Items</td><td style="text-align:right;font-size:13px;">${itemCount}</td></tr>
                <tr><td style="padding:6px 0;color:#666;font-size:13px;">Shipping</td><td style="text-align:right;font-size:13px;">R ${shippingCost.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td></tr>
              </table>
              <table style="width:100%;border-collapse:collapse;margin-top:16px;">${itemsHtml}</table>
              <p style="margin-top:32px;font-size:12px;color:#999;text-align:center;">Log in to your Admin Dashboard to manage this order.</p>
            </div>
          </body></html>`;

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "APPAREL Co. Alerts <onboarding@resend.dev>",
            to: [ADMIN_ALERT_EMAIL],
            subject: `🛒 New order ${formattedTotal} · #${orderShortId}`,
            html: adminHtml,
          }),
        });
        if (!emailRes.ok) {
          const errBody = await emailRes.text();
          console.error("Admin email send failed:", emailRes.status, errBody);
        }
      } else {
        console.log("Admin alert email skipped: ADMIN_ALERT_EMAIL or RESEND_API_KEY not configured");
      }
    } catch (notifErr) {
      console.error("Admin notification/email error (non-fatal):", notifErr);
    }

    return new Response(
      JSON.stringify({ order: { ...order, order_items: savedItems } }),
      { headers: { ...cors, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Verify session error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...cors, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
