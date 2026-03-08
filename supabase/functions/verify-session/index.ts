import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
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
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
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

    return new Response(
      JSON.stringify({ order: { ...order, order_items: savedItems } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Verify session error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
