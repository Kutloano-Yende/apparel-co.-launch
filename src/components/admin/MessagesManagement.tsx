import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MessageSquare, Calendar } from "lucide-react";
import { useState } from "react";

const fetchContactMessages = async () => {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

const fetchSubscribers = async () => {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-ZA", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

const MessagesManagement = () => {
  const [view, setView] = useState<"messages" | "subscribers">("messages");
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: fetchContactMessages,
  });
  const { data: subscribers, isLoading: loadingSubs } = useQuery({
    queryKey: ["admin-newsletter-subscribers"],
    queryFn: fetchSubscribers,
  });

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("messages")}
          className={`font-display text-xs tracking-widest uppercase px-4 py-2 border transition-colors ${
            view === "messages"
              ? "border-foreground bg-foreground text-background"
              : "border-border hover:border-foreground"
          }`}
        >
          Contact Messages ({messages?.length ?? 0})
        </button>
        <button
          onClick={() => setView("subscribers")}
          className={`font-display text-xs tracking-widest uppercase px-4 py-2 border transition-colors ${
            view === "subscribers"
              ? "border-foreground bg-foreground text-background"
              : "border-border hover:border-foreground"
          }`}
        >
          Newsletter ({subscribers?.length ?? 0})
        </button>
      </div>

      {view === "messages" ? (
        <div className="space-y-3">
          {loadingMessages ? (
            <p className="text-muted-foreground">Loading messages...</p>
          ) : !messages?.length ? (
            <p className="text-muted-foreground">No contact messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-muted-foreground" />
                    <span className="font-display text-sm tracking-wide">{msg.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    {formatDate(msg.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-muted-foreground flex-shrink-0" />
                  <a href={`mailto:${msg.email}`} className="underline hover:text-foreground/70 truncate">
                    {msg.email}
                  </a>
                </div>
                {msg.subject && (
                  <p className="text-sm font-display tracking-wide">{msg.subject}</p>
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap border-t border-border pt-3">
                  {msg.message}
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="border border-border">
          {loadingSubs ? (
            <p className="text-muted-foreground p-4">Loading subscribers...</p>
          ) : !subscribers?.length ? (
            <p className="text-muted-foreground p-4">No newsletter subscribers yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {subscribers.map((sub) => (
                <li key={sub.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail size={14} className="text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${sub.email}`} className="text-sm underline hover:text-foreground/70 truncate">
                      {sub.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    {formatDate(sub.created_at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default MessagesManagement;
