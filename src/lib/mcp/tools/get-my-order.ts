import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_order",
  title: "Get my order",
  description: "Fetch one of the signed-in customer's own orders by ID, including the purchased line items.",
  inputSchema: {
    order_id: z.string().trim().min(1).describe("The order's unique ID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, total_amount, shipping_cost, shipping_address, created_at, email")
      .eq("id", order_id)
      .eq("user_id", ctx.getUserId())
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!order) return { content: [{ type: "text", text: `No order found with ID ${order_id}` }], isError: true };

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order_id);

    if (itemsError) return { content: [{ type: "text", text: itemsError.message }], isError: true };

    const payload = { ...order, items: items ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: { order: payload },
    };
  },
});
