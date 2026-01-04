import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Product, formatPrice } from "@/lib/products";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
    >
      <Link to={`/product/${product.id}`} className="block group">
        <motion.div 
          className="relative aspect-square overflow-hidden bg-secondary"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.5 }}
          />
          {product.new && (
            <span className="absolute top-4 left-4 bg-foreground text-background px-3 py-1 font-display text-xs tracking-widest uppercase">
              New
            </span>
          )}
          {product.originalPrice && (
            <span className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 font-display text-xs tracking-widest uppercase">
              Sale
            </span>
          )}
        </motion.div>
        <div className="pt-4 pb-2">
          <h3 className="font-display text-sm tracking-wide uppercase mb-2 group-hover:underline">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-muted-foreground line-through text-sm">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            {product.colors.slice(0, 4).map((color) => (
              <span key={color} className="text-xs text-muted-foreground">
                {color}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
