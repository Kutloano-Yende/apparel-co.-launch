import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/products";

const CartDrawer = () => {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-foreground/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-50 shadow-lg flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-xl tracking-wider uppercase">Your Cart</h2>
              <motion.button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:opacity-70 transition-opacity"
                aria-label="Close cart"
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-muted-foreground mb-6">Your cart is empty</p>
                  <Link
                    to="/shop"
                    className="btn-primary inline-block"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Continue Shopping
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                      <motion.div
                        key={`${item.product.id}-${item.size}-${item.color}`}
                        className="flex gap-4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                      >
                        <motion.div 
                          className="w-24 h-24 bg-secondary flex-shrink-0 overflow-hidden"
                          whileHover={{ scale: 1.05 }}
                        >
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-sm tracking-wide uppercase truncate">
                            {item.product.name}
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {item.size} / {item.color}
                          </p>
                          <p className="font-medium mt-1">{formatPrice(item.product.price)}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border border-border">
                              <motion.button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)
                                }
                                className="p-2 hover:bg-secondary transition-colors"
                                aria-label="Decrease quantity"
                                whileTap={{ scale: 0.9 }}
                              >
                                <Minus size={14} />
                              </motion.button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <motion.button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)
                                }
                                className="p-2 hover:bg-secondary transition-colors"
                                aria-label="Increase quantity"
                                whileTap={{ scale: 0.9 }}
                              >
                                <Plus size={14} />
                              </motion.button>
                            </div>
                            <motion.button
                              onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                              className="p-2 hover:opacity-70 transition-opacity text-muted-foreground hover:text-destructive"
                              aria-label="Remove item"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            <AnimatePresence>
              {items.length > 0 && (
                <motion.div 
                  className="p-6 border-t border-border space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-display tracking-wider uppercase">Subtotal</span>
                    <span className="font-display text-lg">{formatPrice(totalPrice)}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">Shipping calculated at checkout</p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      to="/checkout"
                      className="btn-primary block text-center w-full"
                      onClick={() => setIsCartOpen(false)}
                    >
                      Checkout
                    </Link>
                  </motion.div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="btn-secondary block w-full"
                  >
                    Continue Shopping
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
