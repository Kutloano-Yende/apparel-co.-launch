import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { useFeaturedProducts } from "@/hooks/useProducts";
import FadeInView from "@/components/animations/FadeInView";
import heroPromo from "@/assets/products/hero-promo.jpeg";

const HomePage = () => {
  const { data: featuredProducts = [] } = useFeaturedProducts();

  return (
    <main className="pt-16 md:pt-20">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <motion.img
            src={heroPromo}
            alt="APPAREL Co. 2025 Collection"
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/20 to-foreground/60" />
        </div>
        
        <div className="relative z-10 text-center text-background px-4 max-w-4xl mx-auto">
          <motion.p 
            className="font-display text-sm tracking-[0.3em] uppercase mb-4 opacity-80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            2025 Collection
          </motion.p>
          <motion.h1 
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            APPAREL Co.
          </motion.h1>
          <motion.p 
            className="font-display text-lg md:text-xl tracking-[0.2em] uppercase mb-8 opacity-90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Escape • Embrace • Adventure • Discover Yourself
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link
              to="/shop"
              className="bg-background text-foreground px-10 py-4 font-display font-medium tracking-widest uppercase text-sm hover:opacity-90 transition-opacity"
            >
              Shop Now
            </Link>
            <Link
              to="/shop?category=t-shirts"
              className="border border-background text-background px-10 py-4 font-display font-medium tracking-widest uppercase text-sm hover:bg-background hover:text-foreground transition-all"
            >
              View Collection
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            className="w-6 h-10 border-2 border-background/50 rounded-full flex justify-center"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div 
              className="w-1.5 h-3 bg-background/70 rounded-full mt-2"
              animate={{ opacity: [0.7, 0.3, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Brand Statement */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container-brand text-center max-w-3xl mx-auto">
          <FadeInView>
            <h2 className="section-heading mb-6">Modern Streetwear</h2>
          </FadeInView>
          <FadeInView delay={0.2}>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Born in Midrand, South Africa. APPAREL Co. brings you contemporary streetwear that blends 
              artistic expression with everyday comfort. Each piece tells a story of creativity, culture, 
              and the relentless pursuit of authenticity.
            </p>
          </FadeInView>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container-brand">
          <div className="flex items-center justify-between mb-12">
            <FadeInView>
              <h2 className="section-heading">Featured</h2>
            </FadeInView>
            <FadeInView direction="left">
              <Link to="/shop" className="nav-link hidden sm:block">
                View All
              </Link>
            </FadeInView>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
          <div className="text-center mt-10 sm:hidden">
            <Link to="/shop" className="btn-secondary inline-block">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container-brand">
          <FadeInView className="mb-12 text-center">
            <h2 className="section-heading">Shop by Category</h2>
          </FadeInView>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { to: "/shop?category=t-shirts", label: "T-Shirts" },
              { to: "/shop?category=shorts", label: "Shorts" },
              { to: "/shop?category=hoodies", label: "Hoodies" },
            ].map((category, index) => (
              <FadeInView key={category.label} delay={index * 0.15}>
                <Link
                  to={category.to}
                  className="relative aspect-[4/5] bg-foreground overflow-hidden group block"
                >
                  <motion.div 
                    className="absolute inset-0 bg-foreground/80 flex items-center justify-center"
                    whileHover={{ backgroundColor: "rgba(13, 13, 13, 0.95)" }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.span 
                      className="font-display text-2xl md:text-3xl tracking-widest uppercase text-background"
                      whileHover={{ scale: 1.1, letterSpacing: "0.3em" }}
                      transition={{ duration: 0.3 }}
                    >
                      {category.label}
                    </motion.span>
                  </motion.div>
                </Link>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="py-16 md:py-24 bg-foreground text-background overflow-hidden">
        <div className="container-brand">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              { value: "100%", label: "Premium Cotton" },
              { value: "Local", label: "Made in South Africa" },
              { value: "Limited", label: "Exclusive Drops" },
            ].map((item, index) => (
              <FadeInView key={item.value} delay={index * 0.15}>
                <motion.h3 
                  className="font-display text-4xl md:text-5xl font-bold mb-4"
                  whileInView={{ scale: [0.8, 1.05, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                >
                  {item.value}
                </motion.h3>
                <p className="font-display tracking-widest uppercase text-sm text-background/70">
                  {item.label}
                </p>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
