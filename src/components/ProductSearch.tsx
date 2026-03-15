import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/products";

interface SearchResult {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
}

const ProductSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const search = useCallback(async (term: string) => {
    if (term.length < 2) { setResults([]); return; }
    setIsLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, price, image_url, category")
      .ilike("name", `%${term}%`)
      .limit(6);
    setResults(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((o) => !o);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const selectProduct = (id: string) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    navigate(`/product/${id}`);
  };

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        className="p-2 hover:opacity-70 transition-opacity"
        onClick={() => setIsOpen(true)}
        aria-label="Search products"
        whileTap={{ scale: 0.9 }}
      >
        <Search size={20} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4 bg-foreground/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg bg-background border border-border shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search size={18} className="text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground font-display tracking-wide"
                />
                {query && (
                  <button onClick={() => { setQuery(""); setResults([]); }} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {isLoading && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">Searching...</div>
                )}
                {!isLoading && query.length >= 2 && results.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">No products found</div>
                )}
                {!isLoading && results.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product.id)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-secondary transition-colors text-left"
                  >
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-12 h-12 object-cover bg-secondary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                    </div>
                    <span className="text-sm font-display tracking-wider shrink-0">
                      {formatPrice(product.price)}
                    </span>
                  </button>
                ))}
                {!isLoading && query.length < 2 && (
                  <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                    Type at least 2 characters to search
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductSearch;
