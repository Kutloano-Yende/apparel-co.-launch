import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNotificationSound } from "@/hooks/useNotificationSound";

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  order_id: string | null;
  read: boolean;
  created_at: string;
}

const NOTIF_QUERY_KEY = ["admin-notifications"];

export const useAdminNotifications = (enabled: boolean) => {
  const queryClient = useQueryClient();
  const sound = useNotificationSound();

  const query = useQuery({
    queryKey: NOTIF_QUERY_KEY,
    queryFn: async (): Promise<AdminNotification[]> => {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as AdminNotification[];
    },
    enabled,
  });

  // Realtime subscription
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("admin-notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const row = payload.new as AdminNotification;
          queryClient.setQueryData<AdminNotification[]>(NOTIF_QUERY_KEY, (prev) => [
            row,
            ...(prev || []),
          ]);
          toast.success(row.title, { description: row.message });
          if (row.type === "new_order") sound.play();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "admin_notifications" },
        () => queryClient.invalidateQueries({ queryKey: NOTIF_QUERY_KEY }),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "admin_notifications" },
        () => queryClient.invalidateQueries({ queryKey: NOTIF_QUERY_KEY }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);

  const markAsRead = async (id: string) => {
    await supabase.from("admin_notifications").update({ read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: NOTIF_QUERY_KEY });
  };

  const markAllAsRead = async () => {
    await supabase.from("admin_notifications").update({ read: true }).eq("read", false);
    queryClient.invalidateQueries({ queryKey: NOTIF_QUERY_KEY });
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("admin_notifications").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: NOTIF_QUERY_KEY });
  };

  const unreadCount = (query.data || []).filter((n) => !n.read).length;

  return {
    notifications: query.data || [],
    unreadCount,
    isLoading: query.isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    soundEnabled: sound.enabled,
    setSoundEnabled: sound.setEnabled,
    soundVolume: sound.volume,
    setSoundVolume: sound.setVolume,
    testSound: sound.testSound,
  };
};
