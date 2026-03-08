import { loadStripe, Stripe } from "@stripe/stripe-js";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_51T8m7TFCQqTpVXWk8Vj4073F";

let stripePromise: Promise<Stripe | null> | null = null;

// Warn in development if env var is missing
if (import.meta.env.DEV && !stripePublishableKey) {
  console.warn(
    "⚠️ Missing Stripe publishable key.\n" +
    "Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.\n" +
    "Payment features will not work until this is configured."
  );
}

export const getStripe = () => {
  if (!stripePublishableKey) {
    // Return a rejected promise if key is missing
    return Promise.reject(new Error("Stripe publishable key is not configured"));
  }

  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

