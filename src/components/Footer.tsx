import { Link } from "react-router-dom";
import { Instagram, Twitter, Mail } from "lucide-react";

const Footer = () => {
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
              <a href="#" className="hover:opacity-70 transition-opacity" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:opacity-70 transition-opacity" aria-label="Twitter">
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
              <li><a href="#" className="text-background/70 hover:text-background text-sm transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-background/70 hover:text-background text-sm transition-colors">Shipping Info</a></li>
              <li><a href="#" className="text-background/70 hover:text-background text-sm transition-colors">Returns & Exchanges</a></li>
              <li><a href="#" className="text-background/70 hover:text-background text-sm transition-colors">Size Guide</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display text-sm tracking-widest uppercase mb-6">Newsletter</h4>
            <p className="text-background/70 text-sm mb-4">Subscribe for exclusive drops and updates.</p>
            <form className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Your email"
                className="bg-transparent border border-background/30 px-4 py-3 text-sm placeholder:text-background/50 focus:outline-none focus:border-background transition-colors"
              />
              <button type="submit" className="bg-background text-foreground px-4 py-3 font-display text-sm tracking-widest uppercase hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/50 text-xs">
              © 2025 APPAREL Co. All rights reserved. Midrand, South Africa.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-background/50 hover:text-background text-xs transition-colors">Privacy Policy</a>
              <a href="#" className="text-background/50 hover:text-background text-xs transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
