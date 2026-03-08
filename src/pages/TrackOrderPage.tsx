import { useState } from "react";
import { Package, Search, CheckCircle2, Truck, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/products";
import FadeInView from "@/components/animations/FadeInView";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

interface OrderData {
  id: string;
  email: string;
  status: string;
  total_amount: number;
  shipping_cost: number;
  shipping_address: Record<string, string>;
  created_at: string | null;
  updated_at: string | null;
  order_items: Array<{
    id: string;
    product_name: string;
    product_image: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }>;
}

const statusSteps: { key: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { key: "confirmed", label: "Confirmed", icon: <CheckCircle2 size={20} /> },
  { key: "processing", label: "Processing", icon: <Package size={20} /> },
  { key: "shipped", label: "Shipped", icon: <Truck size={20} /> },
  { key: "delivered", label: "Delivered", icon: <CheckCircle2 size={20} /> },
];

const getStatusIndex = (status: string): number => {
  const map: Record<string, number> = { pending: -1, confirmed: 0, processing: 1, shipped: 2, delivered: 3 };
  return map[status] ?? -1;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered": return "text-green-600";
    case "cancelled": return "text-destructive";
    case "shipped": return "text-blue-600";
    default: return "text-foreground";
  }
};

const TrackOrderPage = () => {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = orderId.trim();
    const trimmedEmail = email.trim();
    if (!trimmedId || !trimmedEmail) return;

    setIsLoading(true);
    setSearched(true);
    setOrder(null);

    try {
      const { data, error } = await supabase.rpc("track_order", {
        _order_id: trimmedId,
        _email: trimmedEmail,
      });

      if (error) throw error;

      if (!data) {
        toast({
          title: "Order not found",
          description: "Please check your order ID and email, then try again.",
          variant: "destructive",
        });
        return;
      }

      setOrder(data as unknown as OrderData);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast({
        title: "Error",
        description: "Could not look up your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentIndex = order ? getStatusIndex(order.status) : -1;
  const isCancelled = order?.status === "cancelled";

  return (
    <main className="pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="container-brand max-w-3xl mx-auto">
        <FadeInView>
          <h1 className="section-heading mb-2">Track Your Order</h1>
          <p className="text-muted-foreground mb-10">
            Enter your order ID and email address to see the latest status.
          </p>
        </FadeInView>

        {/* Search Form */}
        <FadeInView delay={0.1}>
          <form onSubmit={handleSearch} className="space-y-4 mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Order ID"
                  className="input-brand pl-11 w-full"
                  maxLength={100}
                />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="input-brand w-full"
                maxLength={255}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !orderId.trim() || !email.trim()}
              className="btn-primary w-full sm:w-auto px-12 disabled:opacity-50"
            >
              {isLoading ? "Searching..." : "Track Order"}
            </button>
          </form>
        </FadeInView>

        {/* Order Details */}
        {order && (
          <FadeInView>
            <div className="space-y-8">
              {/* Status Header */}
              <div className="border border-border p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-1">Order ID</p>
                    <p className="font-mono text-sm break-all">{order.id}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-muted-foreground font-display tracking-wider uppercase mb-1">Placed On</p>
                    <p className="text-sm">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString("en-ZA", {
                            year: "numeric", month: "long", day: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Current Status Badge */}
                <div className="flex items-center gap-2 mb-8">
                  {isCancelled ? <XCircle size={20} className="text-destructive" /> : <Clock size={20} className="text-muted-foreground" />}
                  <span className={`font-display text-lg tracking-wider uppercase ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Progress Tracker */}
                {!isCancelled && (
                  <div className="relative">
                    <div className="hidden sm:block absolute top-4 left-0 right-0 h-0.5 bg-border">
                      <div
                        className="h-full bg-foreground transition-all duration-700"
                        style={{ width: `${Math.max(0, (currentIndex / (statusSteps.length - 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {statusSteps.map((step, i) => {
                        const isComplete = currentIndex >= i;
                        const isCurrent = currentIndex === i;
                        return (
                          <div key={step.key} className="flex flex-col items-center text-center relative">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 z-10 transition-colors ${
                                isComplete ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                              } ${isCurrent ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
                            >
                              {step.icon}
                            </div>
                            <span className={`text-xs font-display tracking-wider uppercase ${isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isCancelled && (
                  <p className="text-sm text-muted-foreground">
                    This order has been cancelled. Please contact us if you have any questions.
                  </p>
                )}
              </div>

              {/* Order Items */}
              <div className="border border-border p-6 md:p-8">
                <h2 className="font-display text-lg tracking-wider uppercase mb-6">Items</h2>
                <div className="space-y-4">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-secondary flex-shrink-0">
                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-sm tracking-wide truncate">{item.product_name}</h3>
                        <p className="text-muted-foreground text-xs">{item.size} / {item.color} × {item.quantity}</p>
                      </div>
                      <div className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border mt-6 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(order.total_amount - order.shipping_cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{order.shipping_cost === 0 ? "Free" : formatPrice(order.shipping_cost)}</span>
                  </div>
                  <div className="flex justify-between font-display text-base pt-2 border-t border-border">
                    <span className="tracking-wider uppercase">Total</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <div className="border border-border p-6 md:p-8">
                  <h2 className="font-display text-lg tracking-wider uppercase mb-4">Shipping Address</h2>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="text-foreground font-medium">
                      {order.shipping_address.firstName} {order.shipping_address.lastName}
                    </p>
                    <p>{order.shipping_address.address}</p>
                    {order.shipping_address.apartment && <p>{order.shipping_address.apartment}</p>}
                    <p>{order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postalCode}</p>
                    {order.shipping_address.phone && <p>{order.shipping_address.phone}</p>}
                  </div>
                </div>
              )}
            </div>
          </FadeInView>
        )}

        {/* Empty State */}
        {searched && !order && !isLoading && (
          <FadeInView>
            <div className="text-center py-16 border border-border">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <h2 className="font-display text-lg tracking-wider uppercase mb-2">No Order Found</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                We couldn't find an order matching that ID and email. Double-check both fields and try again.
              </p>
            </div>
          </FadeInView>
        )}
      </div>
    </main>
  );
};

export default TrackOrderPage;
