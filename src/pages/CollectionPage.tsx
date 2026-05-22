import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import FadeInView from "@/components/animations/FadeInView";
import { useProductsByCategory } from "@/hooks/useProducts";
import { useReviewStats } from "@/hooks/useReviewStats";
import { formatPrice } from "@/lib/products";

type CollectionSlug = "t-shirts" | "hoodies" | "accessories";

const BASE_URL = "https://apparelco.lovable.app";

interface CollectionConfig {
  slug: CollectionSlug;
  category: string;
  eyebrow: string;
  title: string;
  tagline: string;
  story: string;
  highlights: { label: string; value: string }[];
  metaTitle: string;
  metaDescription: string;
  related: { slug: CollectionSlug; label: string }[];
}

const COLLECTIONS: Record<CollectionSlug, CollectionConfig> = {
  "t-shirts": {
    slug: "t-shirts",
    category: "t-shirts",
    eyebrow: "Core Essentials",
    title: "The Tee Collection",
    tagline: "Premium cotton tees built for everyday wear.",
    story:
      "Cut from 100% premium combed cotton and finished in Midrand, every APPAREL Co. tee is engineered for a structured drape, reinforced shoulders, and prints that hold their depth wash after wash.",
    highlights: [
      { value: "220 GSM", label: "Heavyweight Cotton" },
      { value: "Boxy", label: "Streetwear Fit" },
      { value: "Pre-Shrunk", label: "Wash With Confidence" },
    ],
    metaTitle: "Premium Streetwear T-Shirts | APPAREL Co.",
    metaDescription:
      "Shop heavyweight cotton t-shirts from APPAREL Co. Best-selling tees, limited drops and core staples designed in Midrand, South Africa.",
    related: [
      { slug: "hoodies", label: "Hoodies" },
      { slug: "accessories", label: "Accessories" },
    ],
  },
  hoodies: {
    slug: "hoodies",
    category: "hoodies",
    eyebrow: "Layered Warmth",
    title: "The Hoodie Collection",
    tagline: "Heavyweight fleece hoodies engineered for cold mornings and late nights.",
    story:
      "Brushed-back fleece, double-stitched cuffs and oversized hoods. Our hoodies anchor the APPAREL Co. wardrobe — built to be layered, lived in, and passed down.",
    highlights: [
      { value: "450 GSM", label: "Brushed Fleece" },
      { value: "Oversized", label: "Modern Silhouette" },
      { value: "YKK", label: "Hardware Throughout" },
    ],
    metaTitle: "Heavyweight Streetwear Hoodies | APPAREL Co.",
    metaDescription:
      "Discover premium 450 GSM hoodies from APPAREL Co. Best-selling pullovers and zip-ups crafted for South African streetwear.",
    related: [
      { slug: "t-shirts", label: "T-Shirts" },
      { slug: "accessories", label: "Accessories" },
    ],
  },
  accessories: {
    slug: "accessories",
    category: "accessories",
    eyebrow: "Finishing Pieces",
    title: "The Accessories Collection",
    tagline: "Caps, bags, and small goods to complete the fit.",
    story:
      "The details that pull a look together. Structured headwear, durable carryalls, and small leather goods — each accessory carries the same craftsmanship as our garments.",
    highlights: [
      { value: "Daily", label: "Built For Use" },
      { value: "Compact", label: "Travel Ready" },
      { value: "Signature", label: "APPAREL Co. Branding" },
    ],
    metaTitle: "Streetwear Accessories — Caps, Bags & More | APPAREL Co.",
    metaDescription:
      "Shop APPAREL Co. accessories: caps, bags and small goods designed to finish your streetwear fit.",
    related: [
      { slug: "t-shirts", label: "T-Shirts" },
      { slug: "hoodies", label: "Hoodies" },
    ],
  },
};

const isCollectionSlug = (s: string | undefined): s is CollectionSlug =>
  !!s && (s === "t-shirts" || s === "hoodies" || s === "accessories");

const CollectionPage = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!isCollectionSlug(slug)) {
    return <Navigate to="/shop" replace />;
  }

  const config = COLLECTIONS[slug];
  const { data: products = [], isLoading } = useProductsByCategory(config.category);
  const { data: stats } = useReviewStats();

  // Best-sellers: rank by review count (proxy for popularity), then featured, then newest order.
  const bestSellers = useMemo(() => {
    const ranked = [...products].sort((a, b) => {
      const aCount = stats?.[a.id]?.count ?? 0;
      const bCount = stats?.[b.id]?.count ?? 0;
      if (bCount !== aCount) return bCount - aCount;
      const aFeat = a.featured ? 1 : 0;
      const bFeat = b.featured ? 1 : 0;
      return bFeat - aFeat;
    });
    return ranked.slice(0, 4);
  }, [products, stats]);

  const heroProduct = bestSellers[0];
  const canonicalUrl = `${BASE_URL}/collections/${config.slug}`;
  const ogImage = heroProduct?.image ?? `${BASE_URL}/placeholder.svg`;

  const structuredData = useMemo(() => {
    const collectionPageSchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: config.title,
      description: config.metaDescription,
      url: canonicalUrl,
      image: ogImage,
      brand: {
        "@type": "Brand",
        name: "APPAREL Co.",
      },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: bestSellers.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: product.name,
            image: product.image,
            description: product.description,
            brand: {
              "@type": "Brand",
              name: "APPAREL Co.",
            },
            offers: {
              "@type": "Offer",
              priceCurrency: "ZAR",
              price: product.price.toString(),
              availability: "https://schema.org/InStock",
              url: `${BASE_URL}/product/${product.id}`,
            },
          },
        })),
      },
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: BASE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: config.title,
          item: canonicalUrl,
        },
      ],
    };

    return [collectionPageSchema, breadcrumbSchema];
  }, [config, canonicalUrl, ogImage, bestSellers]);

  return (
    <>
      <Helmet>
        <title>{config.metaTitle}</title>
        <meta name="description" content={config.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:title" content={config.metaTitle} />
        <meta property="og:description" content={config.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="APPAREL Co." />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@apparelco" />
        <meta name="twitter:title" content={config.metaTitle} />
        <meta name="twitter:description" content={config.metaDescription} />
        <meta name="twitter:image" content={ogImage} />

        {/* Structured Data */}
        {structuredData.map((schema, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

      <main className="pt-16 md:pt-20">
        {/* Hero */}
        <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center overflow-hidden bg-foreground text-background">
          {heroProduct && (
            <motion.img
              src={heroProduct.image}
              alt={`${config.title} — featuring ${heroProduct.name}`}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 to-foreground/80" />
          <div className="relative z-10 container-brand py-20">
            <motion.p
              className="font-display text-xs tracking-[0.3em] uppercase mb-6 opacity-80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.8, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {config.eyebrow}
            </motion.p>
            <motion.h1
              className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 max-w-3xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {config.title}
            </motion.h1>
            <motion.p
              className="font-display text-lg md:text-xl max-w-2xl opacity-90 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.9, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {config.tagline}
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link
                to={`/shop?category=${config.category}`}
                className="bg-background text-foreground px-10 py-4 font-display font-medium tracking-widest uppercase text-sm hover:opacity-90 transition-opacity inline-block text-center"
              >
                Shop All {config.title.replace("The ", "").replace(" Collection", "")}
              </Link>
              {heroProduct && (
                <Link
                  to={`/product/${heroProduct.id}`}
                  className="border border-background text-background px-10 py-4 font-display font-medium tracking-widest uppercase text-sm hover:bg-background hover:text-foreground transition-all inline-block text-center"
                >
                  Shop the #1 Best-Seller
                </Link>
              )}
            </motion.div>
          </div>
        </section>

        {/* Story + Highlights */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container-brand grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
            <FadeInView>
              <h2 className="section-heading mb-6">Crafted in Midrand</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">{config.story}</p>
            </FadeInView>
            <FadeInView delay={0.15}>
              <div className="grid grid-cols-3 gap-4">
                {config.highlights.map((h) => (
                  <div key={h.label} className="border-l border-border pl-4">
                    <p className="font-display text-2xl md:text-3xl font-bold">{h.value}</p>
                    <p className="font-display text-[10px] tracking-widest uppercase text-muted-foreground mt-2">
                      {h.label}
                    </p>
                  </div>
                ))}
              </div>
            </FadeInView>
          </div>
        </section>

        {/* Best-Sellers */}
        <section className="py-16 md:py-24 bg-secondary/50">
          <div className="container-brand">
            <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
              <FadeInView>
                <p className="font-display text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">
                  Most Loved
                </p>
                <h2 className="section-heading">Best-Sellers</h2>
              </FadeInView>
              <FadeInView direction="left">
                <Link
                  to={`/shop?category=${config.category}`}
                  className="nav-link"
                >
                  View All
                </Link>
              </FadeInView>
            </div>

            {isLoading ? (
              <p className="text-muted-foreground text-center py-12">Loading collection...</p>
            ) : bestSellers.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">
                New pieces dropping soon.{" "}
                <Link to="/shop" className="underline">
                  Browse the full shop
                </Link>
                .
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-12">
                  {bestSellers.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>

                {/* Quick-shop best-seller list with deep links */}
                <FadeInView>
                  <div className="border-t border-border pt-8">
                    <p className="font-display text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
                      Quick Shop the Top {bestSellers.length}
                    </p>
                    <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                      {bestSellers.map((p, i) => (
                        <li key={p.id} className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-3">
                          <Link
                            to={`/product/${p.id}`}
                            className="font-display text-sm tracking-wide uppercase hover:underline flex-1"
                          >
                            <span className="text-muted-foreground mr-3">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            {p.name}
                          </Link>
                          <span className="text-sm font-medium whitespace-nowrap">
                            {formatPrice(p.price)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </FadeInView>
              </>
            )}
          </div>
        </section>

        {/* Cross-collection links */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container-brand">
            <FadeInView className="mb-12 text-center">
              <h2 className="section-heading">Continue the Look</h2>
            </FadeInView>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {config.related.map((rel, i) => (
                <FadeInView key={rel.slug} delay={i * 0.1}>
                  <Link
                    to={`/collections/${rel.slug}`}
                    className="relative aspect-[16/9] bg-foreground overflow-hidden group block"
                  >
                    <motion.div
                      className="absolute inset-0 bg-foreground/80 flex items-center justify-center"
                      whileHover={{ backgroundColor: "rgba(13, 13, 13, 0.95)" }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-center">
                        <p className="font-display text-[10px] tracking-[0.3em] uppercase text-background/60 mb-2">
                          Shop the Collection
                        </p>
                        <motion.span
                          className="font-display text-3xl md:text-4xl tracking-widest uppercase text-background"
                          whileHover={{ letterSpacing: "0.3em" }}
                          transition={{ duration: 0.3 }}
                        >
                          {rel.label}
                        </motion.span>
                      </div>
                    </motion.div>
                  </Link>
                </FadeInView>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default CollectionPage;
