import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReviewStat {
  count: number;
  average: number;
}

export type ReviewStatsMap = Record<string, ReviewStat>;

// Fetch all reviews and aggregate client-side (one query for the whole grid)
export const useReviewStats = () =>
  useQuery<ReviewStatsMap>({
    queryKey: ["review-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("product_id, rating");
      if (error) throw error;
      const map: ReviewStatsMap = {};
      for (const r of data || []) {
        const entry = map[r.product_id] || { count: 0, average: 0 };
        entry.average = (entry.average * entry.count + r.rating) / (entry.count + 1);
        entry.count += 1;
        map[r.product_id] = entry;
      }
      return map;
    },
    staleTime: 60_000,
  });
