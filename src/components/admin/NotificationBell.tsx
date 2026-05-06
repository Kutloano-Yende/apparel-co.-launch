import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, Volume2, VolumeX, Play } from "lucide-react";
import { toast } from "sonner";
import { useAdminNotifications, AdminNotification } from "@/hooks/useAdminNotifications";

const AUDIO_PERMISSION_KEY = "admin-notif-audio-permission-prompted";

const playTestChime = async (
  testSound: () => Promise<true | "unsupported" | "blocked" | "error">,
  volume: number,
) => {
  const alreadyPrompted =
    typeof window !== "undefined" && localStorage.getItem(AUDIO_PERMISSION_KEY) === "true";

  if (!alreadyPrompted) {
    toast("Allow audio playback?", {
      description:
        "Your browser may block sound until you interact with the page. Click Test again if you didn't hear anything.",
      duration: 4000,
    });
    try {
      localStorage.setItem(AUDIO_PERMISSION_KEY, "true");
    } catch {}
  }

  const result = await testSound();

  if (result === true) {
    if (alreadyPrompted) {
      toast.success("Chime played", {
        description: `Volume ${Math.round(volume * 100)}%`,
        duration: 1500,
      });
    }
    return;
  }

  if (result === "unsupported") {
    toast.error("Audio not supported", {
      description:
        "Your browser doesn't support the Web Audio API. Try a recent version of Chrome, Firefox, Safari, or Edge.",
      duration: 5000,
    });
  } else if (result === "blocked") {
    toast.error("Audio blocked by browser", {
      description:
        "Click anywhere on the page first, then try again. Also check that this site isn't muted in your browser tab settings.",
      duration: 5000,
    });
  } else {
    toast.error("Couldn't play chime", {
      description:
        "Something went wrong. Check your system volume, unmute the browser tab, and try again.",
      duration: 5000,
    });
  }
};

const formatTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
};

const NotificationBell = ({ enabled }: { enabled: boolean }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
    testSound,
  } = useAdminNotifications(enabled);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!enabled) return null;

  const recent = notifications.slice(0, 8);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 hover:bg-secondary transition-colors border border-border"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-foreground text-background text-[10px] font-display tracking-wider rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-background border border-border shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-display text-xs tracking-widest uppercase">
              Notifications
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) playTestChime(testSound, soundVolume);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={soundEnabled ? "Sound on — click to mute" : "Sound off — click to enable"}
                aria-label={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-display tracking-widest uppercase text-muted-foreground hover:text-foreground"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {soundEnabled && (
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border">
              <span className="text-[10px] font-display tracking-widest uppercase text-muted-foreground">
                Volume
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                onMouseUp={() => playTestChime(testSound, soundVolume)}
                onTouchEnd={() => playTestChime(testSound, soundVolume)}
                className="flex-1 h-1 accent-foreground cursor-pointer"
                aria-label="Notification volume"
              />
              <span className="text-[10px] font-display tracking-wider text-muted-foreground w-8 text-right">
                {Math.round(soundVolume * 100)}
              </span>
              <button
                onClick={() => playTestChime(testSound, soundVolume)}
                className="flex items-center gap-1 px-2 py-1 border border-border text-[10px] font-display tracking-widest uppercase text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Test chime"
                aria-label="Test chime"
              >
                <Play size={10} />
                Test
              </button>
            </div>
          )}

          <div className="max-h-[420px] overflow-y-auto">
            {recent.length === 0 ? (
              <p className="px-4 py-8 text-sm text-center text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              recent.map((n: AdminNotification) => (
                <div
                  key={n.id}
                  className={`group px-4 py-3 border-b border-border last:border-0 ${
                    !n.read ? "bg-secondary/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 w-2 h-2 bg-foreground rounded-full flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm tracking-wide truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-display tracking-wider uppercase">
                        {formatTime(n.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="p-1 hover:bg-secondary text-muted-foreground hover:text-foreground"
                          title="Mark as read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="p-1 hover:bg-secondary text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
