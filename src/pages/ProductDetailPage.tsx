import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Minus, Plus, Check } from "lucide-react";
import { getProductById, formatPrice } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import FadeInView from "@/components/animations/FadeInView";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const product = getProductById(id || "");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container-brand text-center py-20">
          <h1 className="section-heading mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist.</p>
          <Link to="/shop" className="btn-primary inline-block">
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }
    if (!selectedColor) {
      toast({
        title: "Please select a color",
        variant: "destructive",
      });
      return;
    }

    addToCart(product, selectedSize, selectedColor, quantity);
    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedSize}, ${selectedColor}) added to your cart.`,
    });
  };

  return (
    <main className="pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="container-brand">
        {/* Back Button */}
        <motion.button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ x: -5 }}
        >
          <ArrowLeft size={18} />
          <span className="font-display text-sm tracking-wider uppercase">Back</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Product Image */}
          <motion.div 
            className="aspect-square bg-secondary overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>

          {/* Product Info */}
          <div className="flex flex-col">
            <AnimatePresence>
              {product.new && (
                <motion.span 
                  className="inline-block bg-foreground text-background px-3 py-1 font-display text-xs tracking-widest uppercase mb-4 w-fit"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  New Arrival
                </motion.span>
              )}
            </AnimatePresence>
            
            <FadeInView delay={0.1}>
              <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">
                {product.name}
              </h1>
            </FadeInView>
            
            <FadeInView delay={0.2}>
              <div className="flex items-center gap-3 mb-6">
                <span className="font-display text-2xl">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-muted-foreground line-through text-lg">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </FadeInView>

            <FadeInView delay={0.3}>
              <p className="text-muted-foreground leading-relaxed mb-8">
                {product.description}
              </p>
            </FadeInView>

            {/* Color Selection */}
            <FadeInView delay={0.4}>
              <div className="mb-6">
                <h3 className="font-display text-sm tracking-widest uppercase mb-3">
                  Color: <span className="font-medium">{selectedColor || "Select"}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <motion.button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border transition-all font-display text-sm tracking-wider ${
                        selectedColor === color
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {color}
                      {selectedColor === color && <Check size={14} className="inline ml-2" />}
                    </motion.button>
                  ))}
                </div>
              </div>
            </FadeInView>

            {/* Size Selection */}
            <FadeInView delay={0.5}>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-display text-sm tracking-widest uppercase">
                    Size: <span className="font-medium">{selectedSize || "Select"}</span>
                  </h3>
                  <button className="text-sm underline text-muted-foreground hover:text-foreground">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <motion.button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 border font-display text-sm tracking-wider transition-all ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>
            </FadeInView>

            {/* Quantity */}
            <FadeInView delay={0.6}>
              <div className="mb-8">
                <h3 className="font-display text-sm tracking-widest uppercase mb-3">Quantity</h3>
                <div className="flex items-center border border-border w-fit">
                  <motion.button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-secondary transition-colors"
                    aria-label="Decrease quantity"
                    whileTap={{ scale: 0.9 }}
                  >
                    <Minus size={18} />
                  </motion.button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <motion.button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-secondary transition-colors"
                    aria-label="Increase quantity"
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus size={18} />
                  </motion.button>
                </div>
              </div>
            </FadeInView>

            {/* Add to Cart */}
            <FadeInView delay={0.7}>
              <motion.button
                onClick={handleAddToCart}
                className="btn-primary w-full mb-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Add to Cart
              </motion.button>
            </FadeInView>

            {/* Additional Info */}
            <FadeInView delay={0.8}>
              <div className="mt-8 pt-8 border-t border-border space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium capitalize">{product.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">Free delivery in South Africa</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Returns</span>
                  <span className="font-medium">30-day return policy</span>
                </div>
              </div>
            </FadeInView>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetailPage;
