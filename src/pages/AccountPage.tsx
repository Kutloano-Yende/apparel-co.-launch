import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, LogOut, Package, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/products";

type AuthMode = "login" | "signup" | "forgot";

// ─── Auth Forms ──────────────────────────────────────────────
const AuthView = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "", password: "", firstName: "", lastName: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === "forgot") {
        await resetPassword(formData.email);
        toast({ title: "Check your email", description: "We sent you a password reset link." });
        setMode("login");
      } else if (mode === "signup") {
        await signUp(formData.email, formData.password, formData.firstName, formData.lastName);
        toast({ title: "Account created!", description: "You're all set and signed in." });
        setMode("login");
      } else {
        await signIn(formData.email, formData.password);
        toast({ title: "Welcome back!" });
      }
    } catch (error) {
      toast({
        title: mode === "forgot" ? "Reset failed" : mode === "login" ? "Login failed" : "Signup failed",
        description: error instanceof Error ? error.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === "forgot") {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="section-heading mb-4">Reset Password</h1>
          <p className="text-muted-foreground">Enter your email to receive a reset link.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-display text-xs tracking-widest uppercase mb-2 block">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-brand" />
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setMode("login")} className="text-sm underline text-muted-foreground hover:text-foreground">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="section-heading mb-4">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-muted-foreground">
          {mode === "login" ? "Sign in to your APPAREL Co. account" : "Join APPAREL Co. for exclusive drops and updates"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "signup" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-display text-xs tracking-widest uppercase mb-2 block">First Name</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="input-brand" />
            </div>
            <div>
              <label className="font-display text-xs tracking-widest uppercase mb-2 block">Last Name</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="input-brand" />
            </div>
          </div>
        )}

        <div>
          <label className="font-display text-xs tracking-widest uppercase mb-2 block">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-brand" />
        </div>

        <div>
          <label className="font-display text-xs tracking-widest uppercase mb-2 block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              className="input-brand pr-12"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {mode === "signup" && <p className="text-xs text-muted-foreground mt-2">Password must be at least 8 characters</p>}
        </div>

        {mode === "login" && (
          <div className="text-right">
            <button type="button" onClick={() => setMode("forgot")} className="text-sm underline text-muted-foreground hover:text-foreground">
              Forgot password?
            </button>
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-border text-center">
        <p className="text-muted-foreground">{mode === "login" ? "Don't have an account?" : "Already have an account?"}</p>
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-display tracking-wider uppercase text-sm mt-2 underline hover:no-underline">
          {mode === "login" ? "Create Account" : "Sign In"}
        </button>
      </div>
    </div>
  );
};

// ─── Dashboard ───────────────────────────────────────────────
const DashboardView = () => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    province: profile?.province || "",
    postal_code: profile?.postal_code || "",
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        province: profile.province || "",
        postal_code: profile.postal_code || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === "orders") {
      setOrdersLoading(true);
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setOrders(data || []);
          setOrdersLoading(false);
        });
    }
  }, [activeTab]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfileForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile(profileForm);
      toast({ title: "Profile updated!" });
    } catch (error) {
      toast({ title: "Update failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const tabs = [
    { key: "profile" as const, label: "Profile", icon: UserIcon },
    { key: "orders" as const, label: "Orders", icon: Package },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="section-heading mb-2">My Account</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <LogOut size={18} />
          <span className="font-display text-xs tracking-widest uppercase hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 pb-3 font-display text-sm tracking-widest uppercase transition-colors border-b-2 -mb-px ${
              activeTab === tab.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <form onSubmit={handleProfileSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-display text-xs tracking-widest uppercase mb-2 block">First Name</label>
              <input type="text" name="first_name" value={profileForm.first_name} onChange={handleProfileChange} className="input-brand" />
            </div>
            <div>
              <label className="font-display text-xs tracking-widest uppercase mb-2 block">Last Name</label>
              <input type="text" name="last_name" value={profileForm.last_name} onChange={handleProfileChange} className="input-brand" />
            </div>
          </div>
          <div>
            <label className="font-display text-xs tracking-widest uppercase mb-2 block">Phone</label>
            <input type="tel" name="phone" value={profileForm.phone} onChange={handleProfileChange} className="input-brand" />
          </div>
          <div>
            <label className="font-display text-xs tracking-widest uppercase mb-2 block">Address</label>
            <input type="text" name="address" value={profileForm.address} onChange={handleProfileChange} className="input-brand" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-display text-xs tracking-widest uppercase mb-2 block">City</label>
              <input type="text" name="city" value={profileForm.city} onChange={handleProfileChange} className="input-brand" />
            </div>
            <div>
              <label className="font-display text-xs tracking-widest uppercase mb-2 block">Province</label>
              <select name="province" value={profileForm.province} onChange={handleProfileChange} className="input-brand">
                <option value="">Select</option>
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
            </div>
            <div>
              <label className="font-display text-xs tracking-widest uppercase mb-2 block">Postal Code</label>
              <input type="text" name="postal_code" value={profileForm.postal_code} onChange={handleProfileChange} className="input-brand" />
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      {activeTab === "orders" && (
        <div>
          {ordersLoading ? (
            <p className="text-muted-foreground">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order.id} className="border border-border p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-sm tracking-wider uppercase">
                      Order #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-display tracking-widest uppercase px-3 py-1 bg-secondary text-secondary-foreground">
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    <span className="font-medium text-foreground">{formatPrice(Number(order.total_amount))}</span>
                  </div>
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="border-t border-border pt-4 space-y-3">
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-secondary flex-shrink-0">
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-xs tracking-wide truncate">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">{item.size} / {item.color} × {item.quantity}</p>
                          </div>
                          <span className="text-sm">{formatPrice(Number(item.price) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────────
const AccountPage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  // After signing in/registering, return the user to where they came from
  // (e.g. the checkout page they were gated out of).
  useEffect(() => {
    if (!isLoading && user && from) {
      navigate(from, { replace: true });
    }
  }, [isLoading, user, from, navigate]);

  if (isLoading) {
    return (
      <main className="pt-24 md:pt-28 pb-16 md:pb-24">
        <div className="container-brand text-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="container-brand">
        {user ? <DashboardView /> : <AuthView />}
      </div>
    </main>
  );
};

export default AccountPage;
