import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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

// Shipping rule must mirror the frontend: free over R1000, else R99.
const FREE_SHIPPING_THRESHOLD = 1000;
const FLAT_SHIPPING = 99;

serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const { items, email, metadata } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided");
    }

    // --- Look up authoritative prices server-side (never trust client prices) ---
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const ids = [...new Set(items.map((i: any) => String(i.product_id)))];
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price, image_url")
      .in("id", ids);
    if (prodErr) throw prodErr;

    const priceMap = new Map(
      (products || []).map((p: any) => [String(p.id), p]),
    );

    let subtotal = 0;
    const line_items = items.map((item: any) => {
      const product = priceMap.get(String(item.product_id));
      if (!product) {
        throw new Error(`Unknown product: ${item.product_id}`);
      }

      const quantity = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
      const unitPrice = Number(product.price); // authoritative DB price
      subtotal += unitPrice * quantity;

      const images: string[] = [];
      const img = product.image_url;
      if (typeof img === "string" && (img.startsWith("http://") || img.startsWith("https://"))) {
        images.push(img);
      }

      return {
        price_data: {
          currency: "zar",
          product_data: {
            name: product.name,
            ...(images.length > 0 ? { images } : {}),
            // size/color are display-only and do not affect price
            description: `Size: ${String(item.size ?? "N/A")} / Color: ${String(item.color ?? "N/A")}`,
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity,
      };
    });

    // --- Shipping computed server-side, not trusted from client ---
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
    if (shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: "zar",
          product_data: { name: "Shipping", description: "Standard delivery" },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Reuse an existing Stripe customer if one matches the email
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || ALLOWED_ORIGINS[0];
    const sessionParams: any = {
      line_items,
      mode: "payment",
      success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: metadata || {},
    };
    if (customerId) sessionParams.customer = customerId;
    else if (email) sessionParams.customer_email = email;

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
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
