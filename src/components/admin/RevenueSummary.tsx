import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/products";
import { TrendingUp, Calendar, CalendarDays, CalendarRange } from "lucide-react";

const PAID_STATUSES = ["paid", "confirmed", "processing", "shipped", "delivered", "completed"];

interface RevenueData {
  today: { total: number; count: number };
  week: { total: number; count: number };
  month: { total: number; count: number };
  allTime: { total: number; count: number };
}

const fetchRevenue = async (): Promise<RevenueData> => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Start of week (Monday)
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday).toISOString();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data, error } = await supabase
    .from("orders")
    .select("total_amount, created_at, status")
    .in("status", PAID_STATUSES);

  if (error) throw error;

  const summarize = (since: string) => {
    const filtered = (data || []).filter((o) => o.created_at >= since);
    return {
      total: filtered.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      count: filtered.length,
    };
  };

  return {
    today: summarize(startOfToday),
    week: summarize(startOfWeek),
    month: summarize(startOfMonth),
    allTime: {
      total: (data || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      count: (data || []).length,
    },
  };
};

const StatCard = ({
  label,
  icon: Icon,
  total,
  count,
  loading,
}: {
  label: string;
  icon: any;
  total: number;
  count: number;
  loading: boolean;
}) => (
  <div className="border border-border p-5 bg-background hover:border-foreground/40 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <span className="font-display text-[10px] tracking-widest uppercase text-muted-foreground">
        {label}
      </span>
      <Icon size={14} className="text-muted-foreground" />
    </div>
    {loading ? (
      <div className="h-7 w-24 bg-secondary animate-pulse" />
    ) : (
      <p className="font-display text-xl tracking-wide">{formatPrice(total)}</p>
    )}
    <p className="text-xs text-muted-foreground mt-1">
      {loading ? "—" : `${count} ${count === 1 ? "order" : "orders"}`}
    </p>
  </div>
);

const RevenueSummary = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-revenue-summary"],
    queryFn: fetchRevenue,
    refetchInterval: 60_000,
  });

  if (error) {
    return (
      <div className="border border-destructive/40 p-4 mb-8 text-sm text-destructive">
        Failed to load revenue summary.
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-muted-foreground" />
        <h2 className="font-display text-sm tracking-widest uppercase">Revenue Summary</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Today"
          icon={Calendar}
          total={data?.today.total ?? 0}
          count={data?.today.count ?? 0}
          loading={isLoading}
        />
        <StatCard
          label="This Week"
          icon={CalendarDays}
          total={data?.week.total ?? 0}
          count={data?.week.count ?? 0}
          loading={isLoading}
        />
        <StatCard
          label="This Month"
          icon={CalendarRange}
          total={data?.month.total ?? 0}
          count={data?.month.count ?? 0}
          loading={isLoading}
        />
        <StatCard
          label="All Time"
          icon={TrendingUp}
          total={data?.allTime.total ?? 0}
          count={data?.allTime.count ?? 0}
          loading={isLoading}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 font-display tracking-wider uppercase">
        Includes paid, processing, shipped & delivered orders · auto-refreshes every minute
      </p>
    </div>
  );
};

export default RevenueSummary;
