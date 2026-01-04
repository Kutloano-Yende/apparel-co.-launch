import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "signup";

const AccountPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: mode === "login" ? "Welcome back!" : "Account created!",
      description: mode === "login" 
        ? "You have been logged in successfully." 
        : "Please check your email to verify your account.",
    });

    setIsLoading(false);
  };

  return (
    <main className="pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="container-brand max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="section-heading mb-4">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "login"
              ? "Sign in to your APPAREL Co. account"
              : "Join APPAREL Co. for exclusive drops and updates"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-display text-xs tracking-widest uppercase mb-2 block">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="input-brand"
                />
              </div>
              <div>
                <label className="font-display text-xs tracking-widest uppercase mb-2 block">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="input-brand"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-display text-xs tracking-widest uppercase mb-2 block">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="input-brand"
            />
          </div>

          <div>
            <label className="font-display text-xs tracking-widest uppercase mb-2 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={8}
                className="input-brand pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode === "signup" && (
              <p className="text-xs text-muted-foreground mt-2">
                Password must be at least 8 characters
              </p>
            )}
          </div>

          {mode === "login" && (
            <div className="text-right">
              <button type="button" className="text-sm underline text-muted-foreground hover:text-foreground">
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-display tracking-wider uppercase text-sm mt-2 underline hover:no-underline"
          >
            {mode === "login" ? "Create Account" : "Sign In"}
          </button>
        </div>

        {/* Demo Notice */}
        <div className="mt-8 p-4 bg-secondary text-center">
          <p className="text-sm text-muted-foreground">
            This is a demo. No real authentication will occur.
          </p>
        </div>
      </div>
    </main>
  );
};

export default AccountPage;
