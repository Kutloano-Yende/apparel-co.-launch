import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, User, LogOut, Shield } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import ProductSearch from "@/components/ProductSearch";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/shop?category=t-shirts", label: "T-Shirts" },
    { href: "/shop?category=shorts", label: "Shorts" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href.split("?")[0]);
  };

  const displayName = profile?.first_name || user?.email?.split("@")[0] || null;

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container-brand">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 -ml-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X size={24} />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.span className="font-display text-xl md:text-2xl font-bold tracking-wider" whileHover={{ letterSpacing: "0.15em" }} transition={{ duration: 0.3 }}>
              APPAREL
            </motion.span>
            <span className="font-display text-xl md:text-2xl font-light tracking-wider ml-1">Co.</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <motion.div key={link.href} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 + 0.2 }}>
                <Link to={link.href} className={`nav-link ${isActive(link.href) ? "text-foreground" : ""}`}>
                  {link.label}
                </Link>
              </motion.div>
            ))}
            {isAdmin && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: navLinks.length * 0.1 + 0.2 }}>
                <Link to="/admin" className={`nav-link flex items-center gap-1.5 ${isActive("/admin") ? "text-foreground" : ""}`}>
                  <Shield size={14} />
                  Admin
                </Link>
              </motion.div>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user && displayName && (
              <span className="hidden md:inline text-xs font-display tracking-wider uppercase text-muted-foreground">
                {displayName}
              </span>
            )}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
              <Link to="/account" className="p-2 hover:opacity-70 transition-opacity">
                <User size={22} />
              </Link>
            </motion.div>
            {user && (
              <motion.button
                className="p-2 hover:opacity-70 transition-opacity hidden md:block"
                onClick={() => signOut()}
                aria-label="Sign out"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
              >
                <LogOut size={20} />
              </motion.button>
            )}
            <motion.button
              className="p-2 hover:opacity-70 transition-opacity relative"
              onClick={() => setIsCartOpen(true)}
              aria-label="Open cart"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.9 }}
            >
              <ShoppingBag size={22} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs font-medium flex items-center justify-center"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              className="md:hidden py-6 border-t border-border overflow-hidden"
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link, index) => (
                  <motion.div key={link.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: index * 0.05 }}>
                    <Link to={link.href} className="font-display text-lg tracking-wider uppercase py-2 block" onClick={() => setIsMobileMenuOpen(false)}>
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                {isAdmin && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: navLinks.length * 0.05 }}>
                    <Link to="/admin" className="font-display text-lg tracking-wider uppercase py-2 flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                      <Shield size={16} />
                      Admin
                    </Link>
                  </motion.div>
                )}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: (navLinks.length + (isAdmin ? 1 : 0)) * 0.05 }}>
                  <Link to="/account" className="font-display text-lg tracking-wider uppercase py-2 block" onClick={() => setIsMobileMenuOpen(false)}>
                    {user ? "My Account" : "Sign In"}
                  </Link>
                </motion.div>
                {user && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: (navLinks.length + 1) * 0.05 }}>
                    <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="font-display text-lg tracking-wider uppercase py-2 block text-muted-foreground">
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
