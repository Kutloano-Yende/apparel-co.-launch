import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Mail } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const emailSchema = z.string().trim().email("Please enter a valid email").max(255);

const Footer = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({ title: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSubscribing(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data });
    setSubscribing(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "You're already subscribed!" });
      } else {
        toast({ title: "Could not subscribe", description: error.message, variant: "destructive" });
      }
      return;
    }
    toast({ title: "Subscribed!", description: "Thanks for joining our newsletter." });
    setEmail("");
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container-brand py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <span className="font-display text-2xl font-bold tracking-wider">APPAREL</span>
              <span className="font-display text-2xl font-light tracking-wider ml-1">Co.</span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed mb-6">
              Modern streetwear from Midrand, South Africa. Escape. Embrace. Adventure. Discover Yourself.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="mailto:hello@apparelco.co.za" className="hover:opacity-70 transition-opacity" aria-label="Email">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-display text-sm tracking-widest uppercase mb-6">Shop</h4>
            <ul className="space-y-3">
              <li><Link to="/shop" className="text-background/70 hover:text-background text-sm transition-colors">All Products</Link></li>
              <li><Link to="/shop?category=t-shirts" className="text-background/70 hover:text-background text-sm transition-colors">T-Shirts</Link></li>
              <li><Link to="/shop?category=shorts" className="text-background/70 hover:text-background text-sm transition-colors">Shorts</Link></li>
              <li><Link to="/shop?category=hoodies" className="text-background/70 hover:text-background text-sm transition-colors">Hoodies</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-display text-sm tracking-widest uppercase mb-6">Help</h4>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-background/70 hover:text-background text-sm transition-colors">Contact Us</Link></li>
              <li><Link to="/track-order" className="text-background/70 hover:text-background text-sm transition-colors">Track Order</Link></li>
              <li><Link to="/shipping" className="text-background/70 hover:text-background text-sm transition-colors">Shipping Info</Link></li>
              <li><Link to="/returns" className="text-background/70 hover:text-background text-sm transition-colors">Returns & Exchanges</Link></li>
              <li><Link to="/size-guide" className="text-background/70 hover:text-background text-sm transition-colors">Size Guide</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display text-sm tracking-widest uppercase mb-6">Newsletter</h4>
            <p className="text-background/70 text-sm mb-4">Subscribe for exclusive drops and updates.</p>
            <form className="flex flex-col gap-3" onSubmit={subscribe}>
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                required
                className="bg-transparent border border-background/30 px-4 py-3 text-sm placeholder:text-background/50 focus:outline-none focus:border-background transition-colors"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="bg-background text-foreground px-4 py-3 font-display text-sm tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {subscribing ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/50 text-xs">
              © 2026 APPAREL Co. All rights reserved. Midrand, South Africa.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-background/50 hover:text-background text-xs transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-background/50 hover:text-background text-xs transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
