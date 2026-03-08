import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, CreditCard } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/products";
import { useToast } from "@/hooks/use-toast";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { createPaymentIntent } from "@/lib/api";

// Payment Form Component (wrapped in Stripe Elements)
const PaymentForm = ({
  formData,
  finalTotal,
  items,
  totalPrice,
  shippingCost,
  onSuccess,
  clientSecret,
}: {
  formData: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    apartment: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
  };
  finalTotal: number;
  items: Array<{ product: { id: string; name: string; image: string; price: number }; size: string; color: string; quantity: number }>;
  totalPrice: number;
  shippingCost: number;
  onSuccess: (orderId: string) => void;
  clientSecret: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === "succeeded") {
        // Get current user for linking order
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        // Save order to database
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: currentUser?.id || null,
            email: formData.email,
            total_amount: finalTotal,
            shipping_cost: shippingCost,
            status: "processing",
            shipping_address: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              address: formData.address,
              apartment: formData.apartment || undefined,
              city: formData.city,
              province: formData.province,
              postalCode: formData.postalCode,
              phone: formData.phone,
            },
            stripe_payment_intent_id: paymentIntent.id,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Save order items
        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          product_image: item.product.image,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.product.price,
        }));

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

        if (itemsError) throw itemsError;

        toast({
          title: "Order placed successfully!",
          description: "Thank you for your purchase. You'll receive a confirmation email shortly.",
        });

        onSuccess(order.id);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred during payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Secure payment powered by Stripe</span>
        </div>
        <PaymentElement />
      </div>
      <button
        type="submit"
        disabled={isProcessing || !stripe}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing..." : `Pay ${formatPrice(finalTotal)}`}
      </button>
    </form>
  );
};

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleOrderSuccess = (orderId: string) => {
    clearCart();
    navigate(`/order-confirmation?order=${orderId}`);
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
        {/* Back Button */}
        <Link
          to="/shop"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span className="font-display text-sm tracking-wider uppercase">Continue Shopping</span>
        </Link>

        <h1 className="section-heading mb-10">Checkout</h1>

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

            {/* Payment */}
            <PaymentSection
              formData={formData}
              finalTotal={finalTotal}
              items={items}
              totalPrice={totalPrice}
              shippingCost={shippingCost}
              onSuccess={handleOrderSuccess}
            />
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
      </div>
    </main>
  );
};

// Payment Section Component - Handles payment intent creation and Stripe Elements setup
const PaymentSection = ({
  formData,
  finalTotal,
  items,
  totalPrice,
  shippingCost,
  onSuccess,
}: {
  formData: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    apartment: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
  };
  finalTotal: number;
  items: Array<{ product: { id: string; name: string; image: string; price: number }; size: string; color: string; quantity: number }>;
  totalPrice: number;
  shippingCost: number;
  onSuccess: () => void;
}) => {
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  useEffect(() => {
    const createIntent = async () => {
      if (!formData.email || finalTotal <= 0) return;

      setIsLoadingPayment(true);
      try {
        const response = await createPaymentIntent({
          amount: finalTotal,
          currency: "zar",
          metadata: {
            email: formData.email,
          },
        });
        setClientSecret(response.clientSecret);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        // Don't show error toast immediately - it might be because backend isn't set up yet
        // The payment section will show a message instead
      } finally {
        setIsLoadingPayment(false);
      }
    };

    createIntent();
  }, [formData.email, finalTotal]);

  if (isLoadingPayment) {
    return (
      <div>
        <h2 className="font-display text-lg tracking-wider uppercase mb-4">Payment</h2>
        <div className="border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Initializing secure payment...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div>
        <h2 className="font-display text-lg tracking-wider uppercase mb-4">Payment</h2>
        <div className="border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium">Payment Setup Required</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            To enable payment processing, please:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
            <li>Set up your backend API endpoint</li>
            <li>Configure Stripe environment variables</li>
            <li>Ensure the payment intent API is running</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            See SETUP.md for detailed instructions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-lg tracking-wider uppercase mb-4">Payment</h2>
      <Elements
        stripe={getStripe()}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
          },
        }}
      >
        <PaymentForm
          formData={formData}
          finalTotal={finalTotal}
          items={items}
          totalPrice={totalPrice}
          shippingCost={shippingCost}
          onSuccess={onSuccess}
          clientSecret={clientSecret}
        />
      </Elements>
    </div>
  );
};

export default CheckoutPage;
