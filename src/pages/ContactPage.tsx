import { useState } from "react";
import { z } from "zod";
import { Mail, MapPin, Clock } from "lucide-react";
import InfoPage from "@/components/InfoPage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

const ContactPage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || "",
      message: parsed.data.message,
    });
    if (error) {
      setSubmitting(false);
      toast({ title: "Could not send message", description: error.message, variant: "destructive" });
      return;
    }
    // Fire-and-forget confirmation email (don't block UX on email delivery)
    supabase.functions.invoke("send-contact-reply", {
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject || "",
        message: parsed.data.message,
      },
    }).catch((err) => console.error("Confirmation email failed:", err));
    setSubmitting(false);
    toast({ title: "Message sent", description: "Check your inbox for a confirmation. We'll reply within 1-2 business days." });
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <InfoPage title="Contact Us" subtitle="We'd love to hear from you. Send us a message and we'll respond as soon as possible.">
      <div className="grid md:grid-cols-3 gap-4 not-prose mb-10">
        <div className="border border-border p-5">
          <Mail size={18} className="mb-2" />
          <p className="font-display text-xs tracking-widest uppercase mb-1">Email</p>
          <a href="mailto:hello@apparelco.co.za" className="text-sm text-muted-foreground hover:text-foreground">hello@apparelco.co.za</a>
        </div>
        <div className="border border-border p-5">
          <MapPin size={18} className="mb-2" />
          <p className="font-display text-xs tracking-widest uppercase mb-1">Location</p>
          <p className="text-sm text-muted-foreground">Midrand, South Africa</p>
        </div>
        <div className="border border-border p-5">
          <Clock size={18} className="mb-2" />
          <p className="font-display text-xs tracking-widest uppercase mb-1">Hours</p>
          <p className="text-sm text-muted-foreground">Mon-Fri, 9am-5pm SAST</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4 not-prose">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength={100}
            className="bg-background border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
            required
          />
          <input
            type="email"
            placeholder="Your email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            maxLength={255}
            className="bg-background border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
            required
          />
        </div>
        <input
          type="text"
          placeholder="Subject (optional)"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          maxLength={200}
          className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
        />
        <textarea
          placeholder="Your message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          maxLength={5000}
          rows={6}
          className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors resize-none"
          required
        />
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
          {submitting ? "Sending..." : "Send Message"}
        </button>
      </form>
    </InfoPage>
  );
};

export default ContactPage;
