import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createHash } from "node:crypto";

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

// Shipping rule must mirror the frontend: free over R1000, else R99.
const FREE_SHIPPING_THRESHOLD = 1000;
const FLAT_SHIPPING = 99;

// PayFast expects urlencoded values with spaces as "+".
const pfEncode = (v: unknown) => encodeURIComponent(String(v).trim()).replace(/%20/g, "+");

serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { items, email, metadata } = await req.json();
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // --- Authoritative prices from the DB (never trust client prices) ---
    const ids = [...new Set(items.map((i: any) => String(i.product_id)))];
    const { data: products, error: prodErr } = await supabase
      .from("products").select("id, name, price, image_url").in("id", ids);
    if (prodErr) throw prodErr;
    const priceMap = new Map((products || []).map((p: any) => [String(p.id), p]));

    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const product = priceMap.get(String(item.product_id));
      if (!product) throw new Error(`Unknown product: ${item.product_id}`);
      const quantity = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
      subtotal += Number(product.price) * quantity;
      const img = product.image_url;
      return {
        product_id: String(item.product_id),
        product_name: product.name,
        product_image: typeof img === "string" ? img : "",
        size: String(item.size ?? "N/A"),
        color: String(item.color ?? "N/A"),
        quantity,
        price: Number(product.price),
      };
    });

    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
    const total = subtotal + shippingCost;

    // Identify the signed-in buyer (checkout requires login).
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data.user?.id ?? null;
    }

    let shippingAddress: any = {};
    try { shippingAddress = JSON.parse(metadata?.shipping_address || "{}"); } catch { /* ignore */ }

    // Create a PENDING order now; the PayFast ITN webhook flips it to paid.
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        email: email || "",
        total_amount: total,
        shipping_cost: shippingCost,
        status: "pending",
        shipping_address: shippingAddress,
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));
    if (itemsErr) throw itemsErr;

    // --- PayFast configuration (defaults to sandbox test credentials) ---
    const sandbox = (Deno.env.get("PAYFAST_SANDBOX") ?? "true") !== "false";
    const merchant_id = Deno.env.get("PAYFAST_MERCHANT_ID") || (sandbox ? "10000100" : "");
    const merchant_key = Deno.env.get("PAYFAST_MERCHANT_KEY") || (sandbox ? "46f0cd694581a" : "");
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") || "";
    const processUrl = sandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    const origin = req.headers.get("origin") || ALLOWED_ORIGINS[0];
    const sbUrl = Deno.env.get("SUPABASE_URL");

    // Build fields in a fixed order; empties are dropped so the form we submit
    // matches exactly what we sign (PayFast re-derives the signature from what it receives).
    const raw: Record<string, string> = {
      merchant_id,
      merchant_key,
      return_url: `${origin}/order-confirmation?ref=${order.id}`,
      cancel_url: `${origin}/checkout`,
      notify_url: `${sbUrl}/functions/v1/payfast-notify`,
      name_first: String(shippingAddress.firstName || "").slice(0, 100),
      name_last: String(shippingAddress.lastName || "").slice(0, 100),
      email_address: String(email || "").slice(0, 100),
      m_payment_id: order.id,
      amount: total.toFixed(2),
      item_name: `APPAREL Co. Order ${String(order.id).slice(0, 8).toUpperCase()}`,
    };
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) if (v !== "" && v != null) fields[k] = v;

    let sigStr = Object.entries(fields).map(([k, v]) => `${k}=${pfEncode(v)}`).join("&");
    if (passphrase) sigStr += `&passphrase=${pfEncode(passphrase)}`;
    fields.signature = createHash("md5").update(sigStr).digest("hex");

    return new Response(
      JSON.stringify({ process_url: processUrl, fields }),
      { headers: { ...cors, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Checkout failed" }),
      { headers: { ...cors, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
