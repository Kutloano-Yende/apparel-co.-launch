import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProductsTool from "./tools/search-products";
import getProductTool from "./tools/get-product";
import listMyOrdersTool from "./tools/list-my-orders";
import getMyOrderTool from "./tools/get-my-order";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "apparel-co-launch",
  title: "APPAREL Co. Launch",
  version: "0.1.0",
  instructions:
    "Tools for the APPAREL Co. streetwear store. Use `search_products` and `get_product` to browse the catalog, and `list_my_orders` / `get_my_order` to look up the signed-in customer's own orders. Prices are in ZAR.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProductsTool, getProductTool, listMyOrdersTool, getMyOrderTool],
});
