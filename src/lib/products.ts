import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  colors: string[];
  sizes: string[];
  description: string;
  featured?: boolean;
  new?: boolean;
}

// Map DB row to Product interface
const mapProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  price: Number(row.price),
  originalPrice: row.original_price ? Number(row.original_price) : undefined,
  image: row.image_url,
  category: row.category,
  colors: row.colors || [],
  sizes: row.sizes || [],
  description: row.description || "",
  featured: row.featured,
  new: row.is_new,
});

export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapProduct);
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapProduct(data);
};

export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  if (category === "all") return fetchProducts();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapProduct);
};

export const fetchFeaturedProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("featured", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapProduct);
};

export const formatPrice = (price: number): string => {
  return `R ${price.toLocaleString()}`;
};
