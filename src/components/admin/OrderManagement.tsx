import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/products";
import { Package, ChevronDown, ChevronUp, Mail, MapPin, Calendar } from "lucide-react";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
}

interface Order {
  id: string;
  email: string;
  status: string;
  total_amount: number;
  shipping_cost: number;
  shipping_address: any;
  created_at: string;
  order_items: OrderItem[];
}

const fetchOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

const OrderManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: fetchOrders });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    if (error) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Order status updated to ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });

      // Send email notification
      const order = orders?.find((o) => o.id === orderId);
      if (order) {
        try {
          const { error: emailError } = await supabase.functions.invoke("send-order-email", {
            body: {
              email: order.email,
              status: newStatus,
              orderId: order.id,
              items: order.order_items,
            },
          });
          if (emailError) {
            console.error("Email notification error:", emailError);
            toast({ title: "Status updated, but email failed to send", description: String(emailError), variant: "destructive" });
          } else {
            toast({ title: "Email notification sent to customer" });
          }
        } catch (e) {
          console.error("Email send error:", e);
        }
      }
    }
    setUpdatingId(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-ZA", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (isLoading) return <p className="text-muted-foreground">Loading orders...</p>;
  if (!orders?.length) return <p className="text-muted-foreground">No orders yet.</p>;

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const isExpanded = expandedOrder === order.id;
        const address = order.shipping_address as any;
        return (
          <div key={order.id} className="border border-border">
            {/* Order Header */}
            <button
              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              className="w-full p-4 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <Package size={20} className="text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-sm tracking-wide">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-display tracking-widest uppercase px-2 py-0.5 rounded-sm ${statusColors[order.status] || "bg-secondary text-secondary-foreground"}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.email} · {formatPrice(order.total_amount)} · {formatDate(order.created_at!)}
                </p>
              </div>
              <span className="text-muted-foreground">
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>

            {/* Order Details */}
            {isExpanded && (
              <div className="border-t border-border p-4 space-y-4">
                {/* Status Update */}
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="font-display text-xs tracking-widest uppercase">Update Status:</label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={updatingId === order.id}
                    className="input-brand text-sm py-1.5 px-3 w-auto"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  {updatingId === order.id && <span className="text-xs text-muted-foreground">Saving...</span>}
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Mail size={14} className="mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span>{order.email}</span>
                  </div>
                  {address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span>
                        {[address.address, address.city, address.province, address.postalCode]
                          .filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Calendar size={14} className="mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span>{formatDate(order.created_at!)}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-display text-xs tracking-widest uppercase mb-2">Items ({order.order_items.length})</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-secondary/30 p-2">
                        <div className="w-10 h-10 bg-secondary flex-shrink-0">
                          <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-display tracking-wide truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Size: {item.size} · Color: {item.color} · Qty: {item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-display">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Total */}
                <div className="flex justify-between items-center pt-2 border-t border-border text-sm">
                  <span className="text-muted-foreground">Shipping: {formatPrice(order.shipping_cost)}</span>
                  <span className="font-display tracking-wide">Total: {formatPrice(order.total_amount)}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderManagement;
