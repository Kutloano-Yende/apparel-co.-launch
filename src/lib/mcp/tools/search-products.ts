import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description: "Search the APPAREL Co. catalog by name, category or keyword. Returns matching products with price, sizes and colors.",
  inputSchema: {
    query: z.string().trim().optional().describe("Free-text search against product name and description."),
    category: z.string().trim().optional().describe("Filter by category, e.g. t-shirts, hoodies, accessories."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum number of products to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("products")
      .select("id, name, price, original_price, category, description, sizes, colors, featured, is_new, image_url")
      .limit(limit ?? 20);

    if (category) q = q.eq("category", category);
    if (query) q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
