import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { products, getProductsByCategory } from "@/lib/products";
import FadeInView from "@/components/animations/FadeInView";

const categories = [
  { value: "all", label: "All Products" },
  { value: "t-shirts", label: "T-Shirts" },
  { value: "shorts", label: "Shorts" },
  { value: "hoodies", label: "Hoodies" },
  { value: "accessories", label: "Accessories" },
];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";
  const [sortBy, setSortBy] = useState("newest");

  const filteredProducts = useMemo(() => {
    let result = getProductsByCategory(categoryParam);

    switch (sortBy) {
      case "price-low":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "newest":
      default:
        result = [...result].sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0));
    }

    return result;
  }, [categoryParam, sortBy]);

  const handleCategoryChange = (category: string) => {
    if (category === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
  };

  return (
    <main className="pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="container-brand">
        {/* Header */}
        <FadeInView className="mb-12">
          <h1 className="section-heading mb-4">
            {categoryParam === "all"
              ? "All Products"
              : categories.find((c) => c.value === categoryParam)?.label || "Shop"}
          </h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </FadeInView>

        {/* Filters */}
        <FadeInView delay={0.1}>
          <div className="flex flex-col sm:flex-row justify-between gap-6 mb-10 pb-6 border-b border-border">
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category, index) => (
                <motion.button
                  key={category.value}
                  onClick={() => handleCategoryChange(category.value)}
                  className={`px-4 py-2 font-display text-xs tracking-widest uppercase transition-colors ${
                    categoryParam === category.value
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground hover:bg-foreground hover:text-background"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {category.label}
                </motion.button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3">
              <label className="font-display text-xs tracking-widest uppercase text-muted-foreground">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-brand py-2 pr-8 min-w-[160px] cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FadeInView>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8"
            layout
          >
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </motion.div>
        ) : (
          <FadeInView className="text-center py-20">
            <p className="text-muted-foreground text-lg mb-4">No products found</p>
            <button
              onClick={() => handleCategoryChange("all")}
              className="btn-secondary"
            >
              View All Products
            </button>
          </FadeInView>
        )}
      </div>
    </main>
  );
};

export default ShopPage;
