import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MessageSquare, Calendar, Reply, Loader2, Check, MailOpen, Search, X, Clock } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type MessageStatus = "unread" | "read" | "replied";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: MessageStatus;
  replied_at: string | null;
};

const fetchContactMessages = async () => {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ContactMessage[];
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

const STATUS_FILTERS: { value: "all" | MessageStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
];

const statusBadgeClass = (status: MessageStatus) => {
  switch (status) {
    case "unread":
      return "bg-foreground text-background";
    case "read":
      return "bg-secondary text-secondary-foreground";
    case "replied":
      return "bg-transparent text-foreground border border-foreground";
  }
};

const MessagesManagement = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"messages" | "subscribers">("messages");
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_FILTERS = ["all", "unread", "read", "replied"] as const;
  const urlFilter = searchParams.get("status");
  const filter = (VALID_FILTERS.includes(urlFilter as typeof VALID_FILTERS[number])
    ? urlFilter
    : "all") as "all" | MessageStatus;
  const setFilter = (next: "all" | MessageStatus) => {
    const params = new URLSearchParams(searchParams);
    if (next === "all") params.delete("status");
    else params.set("status", next);
    setSearchParams(params, { replace: true });
  };
  const [search, setSearch] = useState("");
  const [replyTo, setReplyTo] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: fetchContactMessages,
  });
  const { data: subscribers, isLoading: loadingSubs } = useQuery({
    queryKey: ["admin-newsletter-subscribers"],
    queryFn: fetchSubscribers,
  });

  useEffect(() => {
    setSelectedIds(new Set());
  }, [view, filter]);

  const counts = useMemo(() => {
    const c = { all: messages?.length ?? 0, unread: 0, read: 0, replied: 0 };
    messages?.forEach((m) => { c[m.status] = (c[m.status] ?? 0) + 1; });
    return c;
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    const q = search.trim().toLowerCase();
    return messages.filter((m) => {
      if (filter !== "all" && m.status !== filter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.subject || "").toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    });
  }, [messages, filter, search]);

  const updateStatus = async (msg: ContactMessage, status: MessageStatus) => {
    if (msg.status === status) return;
    setUpdatingId(msg.id);
    const nowIso = new Date().toISOString();
    const patch: { status: MessageStatus; replied_at?: string | null } = { status };
    if (status === "replied") patch.replied_at = nowIso;
    const { error } = await supabase
      .from("contact_messages")
      .update(patch)
      .eq("id", msg.id);
    setUpdatingId(null);
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    queryClient.setQueryData<ContactMessage[]>(["admin-contact-messages"], (old) =>
      old?.map((m) =>
        m.id === msg.id
          ? { ...m, status, replied_at: status === "replied" ? nowIso : m.replied_at }
          : m
      ) ?? []
    );
    toast.success(`Marked as ${status}`);
  };

  const bulkUpdateStatus = async (status: MessageStatus) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkUpdating(true);
    const nowIso = new Date().toISOString();
    const patch: { status: MessageStatus; replied_at?: string | null } = { status };
    if (status === "replied") patch.replied_at = nowIso;
    const { error } = await supabase
      .from("contact_messages")
      .update(patch)
      .in("id", ids);
    setBulkUpdating(false);
    if (error) {
      toast.error("Failed to update messages");
      return;
    }
    queryClient.setQueryData<ContactMessage[]>(["admin-contact-messages"], (old) =>
      old?.map((m) => (selectedIds.has(m.id) ? { ...m, status } : m)) ?? []
    );
    toast.success(`${ids.length} message${ids.length === 1 ? "" : "s"} marked as ${status}`);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected =
    filteredMessages.length > 0 && filteredMessages.every((m) => selectedIds.has(m.id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredMessages.forEach((m) => next.delete(m.id));
      } else {
        filteredMessages.forEach((m) => next.add(m.id));
      }
      return next;
    });
  };

  const openReply = (msg: ContactMessage) => {
    setReplyTo(msg);
    setReplyText("");
    if (msg.status === "unread") void updateStatus(msg, "read");
  };

  const closeReply = () => {
    if (sending) return;
    setReplyTo(null);
    setReplyText("");
  };

  const sendReply = async () => {
    if (!replyTo) return;
    const trimmed = replyText.trim();
    if (trimmed.length < 1) {
      toast.error("Reply cannot be empty");
      return;
    }
    if (trimmed.length > 5000) {
      toast.error("Reply must be 5000 characters or fewer");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-contact-reply", {
        body: {
          mode: "admin-reply",
          name: replyTo.name,
          email: replyTo.email,
          subject: replyTo.subject,
          replyMessage: trimmed,
          originalMessage: replyTo.message,
        },
      });
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || "Send failed");
      toast.success(`Reply sent to ${replyTo.email}`);
      await updateStatus(replyTo, "replied");
      setReplyTo(null);
      setReplyText("");
    } catch (err) {
      console.error("Send reply failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

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
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`font-display text-[11px] tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                  filter === f.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground"
                }`}
              >
                {f.label} ({counts[f.value]})
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, subject, or message..."
              className="w-full pl-9 pr-9 py-2 text-sm border border-border bg-background focus:outline-none focus:border-foreground transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bulk actions bar */}
          {filteredMessages.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap border border-border bg-muted/30 px-3 py-2">
              <label className="flex items-center gap-2 text-xs font-display tracking-widest uppercase cursor-pointer">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={toggleSelectAllVisible}
                  aria-label="Select all visible messages"
                />
                {selectedIds.size > 0
                  ? `${selectedIds.size} selected`
                  : `Select all (${filteredMessages.length})`}
              </label>
              {selectedIds.size > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    disabled={bulkUpdating}
                    onClick={() => bulkUpdateStatus("unread")}
                    className="font-display text-[11px] tracking-widest uppercase px-3 py-1.5 border border-border hover:border-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Mail size={12} /> Mark Unread
                  </button>
                  <button
                    disabled={bulkUpdating}
                    onClick={() => bulkUpdateStatus("read")}
                    className="font-display text-[11px] tracking-widest uppercase px-3 py-1.5 border border-border hover:border-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <MailOpen size={12} /> Mark Read
                  </button>
                  <button
                    disabled={bulkUpdating}
                    onClick={() => bulkUpdateStatus("replied")}
                    className="font-display text-[11px] tracking-widest uppercase px-3 py-1.5 border border-border hover:border-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check size={12} /> Mark Replied
                  </button>
                  <button
                    disabled={bulkUpdating}
                    onClick={() => setSelectedIds(new Set())}
                    className="font-display text-[11px] tracking-widest uppercase px-3 py-1.5 border border-border hover:border-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <X size={12} /> Clear
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {loadingMessages ? (
              <p className="text-muted-foreground">Loading messages...</p>
            ) : !filteredMessages.length ? (
              <p className="text-muted-foreground">
                {messages?.length ? `No ${filter} messages.` : "No contact messages yet."}
              </p>
            ) : (
              filteredMessages.map((msg) => (
                <div key={msg.id} className="border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Checkbox
                        checked={selectedIds.has(msg.id)}
                        onCheckedChange={() => toggleSelect(msg.id)}
                        aria-label={`Select message from ${msg.name}`}
                      />
                      <MessageSquare size={16} className="text-muted-foreground" />
                      <span className="font-display text-sm tracking-wide">{msg.name}</span>
                      <span
                        className={`text-[10px] font-display tracking-widest uppercase px-2 py-0.5 ${statusBadgeClass(msg.status)}`}
                      >
                        {msg.status}
                      </span>
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
                  <div className="flex justify-end gap-2 pt-1 flex-wrap">
                    {msg.status === "unread" ? (
                      <button
                        disabled={updatingId === msg.id}
                        onClick={() => updateStatus(msg, "read")}
                        className="font-display text-xs tracking-widest uppercase px-3 py-2 border border-border hover:border-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <MailOpen size={12} />
                        Mark Read
                      </button>
                    ) : (
                      <button
                        disabled={updatingId === msg.id}
                        onClick={() => updateStatus(msg, "unread")}
                        className="font-display text-xs tracking-widest uppercase px-3 py-2 border border-border hover:border-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Mail size={12} />
                        Mark Unread
                      </button>
                    )}
                    {msg.status !== "replied" && (
                      <button
                        disabled={updatingId === msg.id}
                        onClick={() => updateStatus(msg, "replied")}
                        className="font-display text-xs tracking-widest uppercase px-3 py-2 border border-border hover:border-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check size={12} />
                        Mark Replied
                      </button>
                    )}
                    <button
                      onClick={() => openReply(msg)}
                      className="font-display text-xs tracking-widest uppercase px-3 py-2 border border-border hover:border-foreground hover:bg-foreground hover:text-background transition-colors flex items-center gap-1.5"
                    >
                      <Reply size={12} />
                      Reply
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
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

      {/* Reply dialog */}
      <Dialog open={!!replyTo} onOpenChange={(open) => !open && closeReply()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide">Reply to {replyTo?.name}</DialogTitle>
            <DialogDescription className="break-all">
              To: <span className="text-foreground">{replyTo?.email}</span>
              {replyTo?.subject && (
                <>
                  <br />
                  Subject: <span className="text-foreground">Re: {replyTo.subject}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {replyTo?.message && (
            <div className="bg-muted/40 p-3 text-xs text-muted-foreground whitespace-pre-wrap border-l-2 border-border max-h-32 overflow-y-auto">
              {replyTo.message}
            </div>
          )}

          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            rows={8}
            disabled={sending}
            className="resize-none"
            maxLength={5000}
          />
          <p className="text-[11px] text-muted-foreground text-right">
            {replyText.length}/5000
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={closeReply} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={sendReply} disabled={sending || replyText.trim().length === 0}>
              {sending ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Reply size={14} className="mr-2" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesManagement;
