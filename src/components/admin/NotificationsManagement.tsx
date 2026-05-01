import { Bell, Check, Trash2, CheckCheck } from "lucide-react";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

const formatTime = (iso: string) => {
  return new Date(iso).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const NotificationsManagement = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useAdminNotifications(true);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading notifications...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-lg tracking-wider uppercase">Notifications</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-xs font-display tracking-widest uppercase text-muted-foreground hover:text-foreground"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border">
          <Bell size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            New paid orders will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`border p-4 flex items-start gap-3 transition-colors ${
                !n.read
                  ? "border-foreground/40 bg-secondary/30"
                  : "border-border"
              }`}
            >
              {!n.read && (
                <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm tracking-wide">{n.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-2 font-display tracking-wider uppercase">
                  {formatTime(n.created_at)} · {n.type.replace("_", " ")}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-2 text-muted-foreground hover:text-foreground"
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="p-2 text-muted-foreground hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsManagement;
