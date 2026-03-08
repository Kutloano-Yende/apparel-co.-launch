import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, MapPin, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/products";
import FadeInView from "@/components/animations/FadeInView";

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
  items: Array<{
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
  const orderId = searchParams.get("order");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setIsLoading(false);
        return;
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !orderData) {
        setIsLoading(false);
        return;
      }

      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      const address = orderData.shipping_address as OrderData["shipping_address"];

      setOrder({
        ...orderData,
        shipping_address: address,
        items: itemsData || [],
      });
      setIsLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container-brand text-center py-20">
          <p className="text-muted-foreground">Loading order details...</p>
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
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <CheckCircle size={64} className="text-green-600" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight uppercase mb-3">
              Order Confirmed
            </h1>
            <p className="text-muted-foreground">
              Thank you for your purchase! We've sent a confirmation to{" "}
              <span className="text-foreground font-medium">{order.email}</span>
            </p>
          </div>

          {/* Order Number */}
          <div className="border border-border p-6 mb-8 text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
              Order Number
            </p>
            <p className="font-display text-lg tracking-wide font-semibold">
              {order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Package size={18} className="text-muted-foreground" />
              <h2 className="font-display text-lg tracking-wider uppercase">
                Items Ordered
              </h2>
            </div>
            <div className="border border-border divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4">
                  <div className="w-16 h-16 bg-secondary flex-shrink-0">
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
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

          {/* Summary & Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
            {/* Shipping Address */}
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

            {/* Order Total */}
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

          {/* CTA */}
          <div className="text-center">
            <Link to="/shop" className="btn-primary inline-block">
              Continue Shopping
            </Link>
          </div>
        </FadeInView>
      </div>
    </main>
  );
};

export default OrderConfirmationPage;
