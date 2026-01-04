import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { getFeaturedProducts } from "@/lib/products";
import heroPromo from "@/assets/products/hero-promo.jpeg";

const HomePage = () => {
  const featuredProducts = getFeaturedProducts();

  return (
    <main className="pt-16 md:pt-20">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroPromo}
            alt="APPAREL Co. 2025 Collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/20 to-foreground/60" />
        </div>
        
        <div className="relative z-10 text-center text-background px-4 max-w-4xl mx-auto animate-slide-up">
          <p className="font-display text-sm tracking-[0.3em] uppercase mb-4 opacity-80">
            2025 Collection
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4">
            APPAREL Co.
          </h1>
          <p className="font-display text-lg md:text-xl tracking-[0.2em] uppercase mb-8 opacity-90">
            Escape • Embrace • Adventure • Discover Yourself
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          </div>
        </div>
      </section>

      {/* Brand Statement */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container-brand text-center max-w-3xl mx-auto">
          <h2 className="section-heading mb-6">Modern Streetwear</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Born in Midrand, South Africa. APPAREL Co. brings you contemporary streetwear that blends 
            artistic expression with everyday comfort. Each piece tells a story of creativity, culture, 
            and the relentless pursuit of authenticity.
          </p>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container-brand">
          <div className="flex items-center justify-between mb-12">
            <h2 className="section-heading">Featured</h2>
            <Link
              to="/shop"
              className="nav-link hidden sm:block"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
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
          <h2 className="section-heading mb-12 text-center">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/shop?category=t-shirts"
              className="relative aspect-[4/5] bg-foreground overflow-hidden group"
            >
              <div className="absolute inset-0 bg-foreground/80 flex items-center justify-center transition-all group-hover:bg-foreground/90">
                <span className="font-display text-2xl md:text-3xl tracking-widest uppercase text-background">
                  T-Shirts
                </span>
              </div>
            </Link>
            <Link
              to="/shop?category=shorts"
              className="relative aspect-[4/5] bg-brand-gray-300 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-foreground/80 flex items-center justify-center transition-all group-hover:bg-foreground/90">
                <span className="font-display text-2xl md:text-3xl tracking-widest uppercase text-background">
                  Shorts
                </span>
              </div>
            </Link>
            <Link
              to="/shop?category=hoodies"
              className="relative aspect-[4/5] bg-brand-gray-200 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-foreground/80 flex items-center justify-center transition-all group-hover:bg-foreground/90">
                <span className="font-display text-2xl md:text-3xl tracking-widest uppercase text-background">
                  Hoodies
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="py-16 md:py-24 bg-foreground text-background">
        <div className="container-brand">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <h3 className="font-display text-4xl md:text-5xl font-bold mb-4">100%</h3>
              <p className="font-display tracking-widest uppercase text-sm text-background/70">Premium Cotton</p>
            </div>
            <div>
              <h3 className="font-display text-4xl md:text-5xl font-bold mb-4">Local</h3>
              <p className="font-display tracking-widest uppercase text-sm text-background/70">Made in South Africa</p>
            </div>
            <div>
              <h3 className="font-display text-4xl md:text-5xl font-bold mb-4">Limited</h3>
              <p className="font-display tracking-widest uppercase text-sm text-background/70">Exclusive Drops</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
