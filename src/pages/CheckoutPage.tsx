import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/products";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Require an account before checkout. Send guests to sign in / register,
  // remembering to bring them back to checkout afterwards.
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Sign in to check out",
        description: "Create an account or sign in to complete your order.",
      });
      navigate("/account", { state: { from: "/checkout" }, replace: true });
    }
  }, [authLoading, user, navigate, toast]);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
  });

  // Auto-fill from profile when authenticated
  useEffect(() => {
    if (user && profile) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        firstName: profile.first_name || prev.firstName,
        lastName: profile.last_name || prev.lastName,
        address: profile.address || prev.address,
        city: profile.city || prev.city,
        province: profile.province || prev.province,
        postalCode: profile.postal_code || prev.postalCode,
        phone: profile.phone || prev.phone,
      }));
    }
  }, [user, profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.address || !formData.city || !formData.province || !formData.postalCode || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Save shipping info to localStorage for order confirmation
      localStorage.setItem("checkout_shipping", JSON.stringify(formData));

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          items: items.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            product_image: item.product.image,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: item.product.price,
          })),
          shipping_cost: shippingCost,
          email: formData.email,
          metadata: {
            shipping_address: JSON.stringify({
              firstName: formData.firstName,
              lastName: formData.lastName,
              address: formData.address,
              apartment: formData.apartment || "",
              city: formData.city,
              province: formData.province,
              postalCode: formData.postalCode,
              phone: formData.phone,
            }),
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.process_url && data?.fields) {
        // Redirect to PayFast by POSTing the signed fields via a hidden form.
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.process_url;
        Object.entries(data.fields as Record<string, string>).forEach(([name, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = String(value);
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container-brand text-center py-20">
          <h1 className="section-heading mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">Add some items to your cart to proceed to checkout.</p>
          <Link to="/shop" className="btn-primary inline-block">
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  const shippingCost = totalPrice >= 1000 ? 0 : 99;
  const finalTotal = totalPrice + shippingCost;

  return (
    <main className="pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="container-brand">
        <Link
          to="/shop"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span className="font-display text-sm tracking-wider uppercase">Continue Shopping</span>
        </Link>

        <h1 className="section-heading mb-10">Checkout</h1>

        <form onSubmit={handleCheckout}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Checkout Form */}
            <div className="space-y-8">
              {/* Contact */}
              <div>
                <h2 className="font-display text-lg tracking-wider uppercase mb-4">Contact</h2>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input-brand"
                />
              </div>

              {/* Shipping Address */}
              <div>
                <h2 className="font-display text-lg tracking-wider uppercase mb-4">Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="input-brand"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="input-brand"
                  />
                </div>
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="input-brand mt-4"
                />
                <input
                  type="text"
                  name="apartment"
                  placeholder="Apartment, suite, etc. (optional)"
                  value={formData.apartment}
                  onChange={handleInputChange}
                  className="input-brand mt-4"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="input-brand"
                  />
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    required
                    className="input-brand"
                  >
                    <option value="">Province</option>
                    <option value="gauteng">Gauteng</option>
                    <option value="western-cape">Western Cape</option>
                    <option value="kwazulu-natal">KwaZulu-Natal</option>
                    <option value="eastern-cape">Eastern Cape</option>
                    <option value="mpumalanga">Mpumalanga</option>
                    <option value="limpopo">Limpopo</option>
                    <option value="north-west">North West</option>
                    <option value="free-state">Free State</option>
                    <option value="northern-cape">Northern Cape</option>
                  </select>
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="Postal code"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                    className="input-brand"
                  />
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="input-brand mt-4"
                />
              </div>

              {/* Payment Notice */}
              <div>
                <h2 className="font-display text-lg tracking-wider uppercase mb-4">Payment</h2>
                <div className="border border-border p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock size={18} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Secure payment powered by Stripe</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You'll be redirected to Stripe's secure checkout to complete your payment.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                {isProcessing ? "Redirecting to payment..." : `Pay ${formatPrice(finalTotal)}`}
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:pl-12 lg:border-l border-border">
              <h2 className="font-display text-lg tracking-wider uppercase mb-6">Order Summary</h2>

              <div className="space-y-4 mb-8">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}-${item.color}`}
                    className="flex gap-4"
                  >
                    <div className="relative w-20 h-20 bg-secondary flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-foreground text-background text-xs flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm tracking-wide truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {item.size} / {item.color}
                      </p>
                    </div>
                    <div className="font-medium">
                      {formatPrice(item.product.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                </div>
                {shippingCost === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Free shipping on orders over R1,000
                  </p>
                )}
                <div className="flex justify-between font-display text-lg pt-3 border-t border-border">
                  <span className="tracking-wider uppercase">Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};

export default CheckoutPage;
