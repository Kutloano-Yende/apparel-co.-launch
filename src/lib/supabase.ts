import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Create client with fallback values if env vars are missing
// This allows the app to load, but Supabase features won't work until env vars are set
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

// Warn in development if env vars are missing
if (import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    "⚠️ Missing Supabase environment variables.\n" +
    "Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.\n" +
    "Supabase features will not work until these are configured."
  );
}

// Database types (you'll need to generate these from your Supabase schema)
export type Database = {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          total_amount: number;
          shipping_cost: number;
          status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
          shipping_address: {
            firstName: string;
            lastName: string;
            address: string;
            apartment?: string;
            city: string;
            province: string;
            postalCode: string;
            phone: string;
          };
          stripe_payment_intent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          product_image: string;
          size: string;
          color: string;
          quantity: number;
          price: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      customers: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
    };
  };
};

