import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, MapPin, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/products";
import FadeInView from "@/components/animations/FadeInView";
import { useCart } from "@/context/CartContext";

type OrderData = {
  id: string;
  email: string;
  total_amount: number;
  shipping_cost: number;
  status: string;
  shipping_address: {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  created_at: string;
  order_items: Array<{
    id: string;
    product_name: string;
    product_image: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }>;
};

const OrderConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { clearCart } = useCart();

  useEffect(() => {
    const processOrder = async () => {
      try {
        if (!sessionId) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke("verify-session", {
          body: { session_id: sessionId },
        });

        if (error || data?.error) {
          console.error("Session verification error:", error || data?.error);
          setIsLoading(false);
          return;
        }

        if (data?.order) {
          setOrder(data.order as OrderData);
          clearCart();
          localStorage.removeItem("checkout_shipping");
        }
      } catch (err) {
        console.error("Error processing order:", err);
      } finally {
        setIsLoading(false);
      }
    };

    processOrder();
  }, [sessionId]);

  if (isLoading) {
    return (
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container-brand text-center py-20">
          <p className="text-muted-foreground">Processing your order...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container-brand text-center py-20">
          <h1 className="section-heading mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find this order. Please check your email for confirmation.
          </p>
          <Link to="/shop" className="btn-primary inline-block">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  const subtotal = order.total_amount - order.shipping_cost;

  return (
    <main className="pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="container-brand max-w-3xl">
        <FadeInView>
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <CheckCircle size={64} className="text-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight uppercase mb-3">
              Order Confirmed
            </h1>
            <p className="text-muted-foreground">
              Thank you for your purchase! We've sent a confirmation to{" "}
              <span className="text-foreground font-medium">{order.email}</span>
            </p>
          </div>

          <div className="border border-border p-6 mb-8 text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
              Order Number
            </p>
            <p className="font-display text-lg tracking-wide font-semibold">
              {order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {order.order_items && order.order_items.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} className="text-muted-foreground" />
                <h2 className="font-display text-lg tracking-wider uppercase">
                  Items Ordered
                </h2>
              </div>
              <div className="border border-border divide-y divide-border">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4">
                    <div className="w-16 h-16 bg-secondary flex-shrink-0">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm tracking-wide">
                        {item.product_name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {item.size} / {item.color} × {item.quantity}
                      </p>
                    </div>
                    <div className="font-medium text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={18} className="text-muted-foreground" />
                <h2 className="font-display text-sm tracking-wider uppercase">
                  Shipping To
                </h2>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="text-foreground font-medium">
                  {order.shipping_address.firstName} {order.shipping_address.lastName}
                </p>
                <p>{order.shipping_address.address}</p>
                <p>
                  {order.shipping_address.city}, {order.shipping_address.province}{" "}
                  {order.shipping_address.postalCode}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail size={18} className="text-muted-foreground" />
                <h2 className="font-display text-sm tracking-wider uppercase">
                  Order Total
                </h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {order.shipping_cost === 0 ? "Free" : formatPrice(order.shipping_cost)}
                  </span>
                </div>
                <div className="flex justify-between font-display text-base pt-2 border-t border-border">
                  <span className="tracking-wider uppercase">Total</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <Link to="/track-order" className="btn-primary inline-block">
              Track Your Order
            </Link>
            <div>
              <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </FadeInView>
      </div>
    </main>
  );
};

export default OrderConfirmationPage;
