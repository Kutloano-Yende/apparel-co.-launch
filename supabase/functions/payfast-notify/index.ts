import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { createHash } from "node:crypto";

// PayFast ITN (Instant Transaction Notification) webhook.
// PayFast POSTs here server-to-server after a payment. This is the AUTHORITATIVE
// confirmation that marks an order paid — it does not depend on the buyer's browser.
// No CORS/JWT: PayFast is not a browser and sends no auth. Security = signature
// check + server validation callback + amount match (see below).

const pfEncode = (v: unknown) => encodeURIComponent(String(v).trim()).replace(/%20/g, "+");

serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  try {
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    const data: Record<string, string> = {};
    for (const [k, v] of params) data[k] = v;

    const sandbox = (Deno.env.get("PAYFAST_SANDBOX") ?? "true") !== "false";
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") || "";

    // 1) Verify the signature over the received fields (in received order).
    let sigStr = Object.entries(data)
      .filter(([k, v]) => k !== "signature" && v !== "")
      .map(([k, v]) => `${k}=${pfEncode(v)}`)
      .join("&");
    if (passphrase) sigStr += `&passphrase=${pfEncode(passphrase)}`;
    const calc = createHash("md5").update(sigStr).digest("hex");
    if (calc !== data.signature) {
      console.error("PayFast ITN: signature mismatch");
      return new Response("invalid signature", { status: 400 });
    }

    // 2) Server-to-server validation callback — confirm PayFast actually sent this.
    const validateUrl = sandbox
      ? "https://sandbox.payfast.co.za/eng/query/validate"
      : "https://www.payfast.co.za/eng/query/validate";
    const vRes = await fetch(validateUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    const vText = (await vRes.text()).trim();
    if (vText !== "VALID") {
      console.error("PayFast ITN: validation not VALID ->", vText);
      return new Response("not validated", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const orderId = data.m_payment_id;
    const { data: order } = await supabase
      .from("orders").select("*, order_items(*)").eq("id", orderId).maybeSingle();
    // Return 200 for unknown orders so PayFast stops retrying.
    if (!order) {
      console.error("PayFast ITN: order not found", orderId);
      return new Response("OK", { status: 200 });
    }

    // 3) Amount must match what we charged.
    if (Number(order.total_amount).toFixed(2) !== Number(data.amount_gross).toFixed(2)) {
      console.error("PayFast ITN: amount mismatch", order.total_amount, data.amount_gross);
      return new Response("amount mismatch", { status: 400 });
    }

    // 4) Only act on a completed payment for a still-pending order (idempotent).
    if (data.payment_status === "COMPLETE" && order.status === "pending") {
      await supabase.from("orders")
        .update({ status: "processing", stripe_payment_intent_id: data.pf_payment_id || null })
        .eq("id", orderId);

      // Realtime admin alert (best-effort).
      try {
        const itemCount = (order.order_items || []).reduce((s: number, it: any) => s + (it.quantity || 0), 0);
        const total = `R ${Number(order.total_amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const shortId = String(order.id).slice(0, 8).toUpperCase();
        await supabase.from("admin_notifications").insert({
          type: "new_order",
          title: `New paid order · ${total}`,
          message: `${itemCount} item${itemCount === 1 ? "" : "s"} from ${order.email || "unknown"} (#${shortId})`,
          order_id: order.id,
          metadata: { order_id: order.id, email: order.email, total_amount: order.total_amount, item_count: itemCount, pf_payment_id: data.pf_payment_id },
        });
      } catch (e) {
        console.error("admin notification failed (non-fatal):", e);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (e) {
    // Log and 200 so PayFast doesn't hammer retries on our bug; we can replay manually.
    console.error("payfast-notify error:", e);
    return new Response("OK", { status: 200 });
  }
});
