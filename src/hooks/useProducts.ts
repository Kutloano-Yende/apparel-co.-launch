import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchProductById, fetchProductsByCategory, fetchFeaturedProducts } from "@/lib/products";

export const useProducts = () =>
  useQuery({ queryKey: ["products"], queryFn: fetchProducts });

export const useProduct = (id: string) =>
  useQuery({ queryKey: ["product", id], queryFn: () => fetchProductById(id), enabled: !!id });

export const useProductsByCategory = (category: string) =>
  useQuery({ queryKey: ["products", category], queryFn: () => fetchProductsByCategory(category) });

export const useFeaturedProducts = () =>
  useQuery({ queryKey: ["products", "featured"], queryFn: fetchFeaturedProducts });
