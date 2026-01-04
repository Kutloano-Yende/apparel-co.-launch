import { Link } from "react-router-dom";
import { Product, formatPrice } from "@/lib/products";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link to={`/product/${product.id}`} className="product-card block">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500"
          loading="lazy"
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
      </div>
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
  );
};

export default ProductCard;
