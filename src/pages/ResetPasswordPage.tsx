import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      const hash = window.location.hash;

      // Preferred path: verify a recovery/invite token directly in-app.
      // This avoids depending on the project's Site URL / redirect allow-list.
      if (tokenHash && (type === "recovery" || type === "invite")) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "recovery" | "invite",
        });
        if (!active) return;
        if (error) {
          toast({ title: "Invalid or expired link", description: error.message, variant: "destructive" });
          navigate("/account");
          return;
        }
        // Scrub the token from the URL so it isn't left in history.
        window.history.replaceState({}, "", "/reset-password");
        setVerifying(false);
        return;
      }

      // Fallback: classic hash-fragment redirect flow (access_token in URL hash).
      if (hash.includes("type=recovery") || hash.includes("access_token")) {
        setVerifying(false);
        return;
      }

      toast({
        title: "Invalid link",
        description: "This password reset link is invalid or has expired.",
        variant: "destructive",
      });
      navigate("/account");
    })();
    return () => {
      active = false;
    };
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await updatePassword(password);
      toast({ title: "Password set!", description: "You're signed in. Welcome aboard." });
      navigate("/account");
    } catch (error) {
      toast({
        title: "Failed to set password",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <main className="pt-24 md:pt-28 pb-16 md:pb-24">
        <div className="container-brand max-w-md mx-auto text-center">
          <h1 className="section-heading mb-4">Verifying your link…</h1>
          <p className="text-muted-foreground">One moment while we confirm your invitation.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="container-brand max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="section-heading mb-4">Set Your Password</h1>
          <p className="text-muted-foreground">Choose a password to finish setting up your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-display text-xs tracking-widest uppercase mb-2 block">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          </div>

          <div>
            <label className="font-display text-xs tracking-widest uppercase mb-2 block">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="input-brand"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Set Password"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default ResetPasswordPage;
