// API service functions for backend communication
// Note: You'll need to create a backend API endpoint for creating payment intents
// This is a placeholder that shows the expected structure

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export const createPaymentIntent = async (
  data: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> => {
  const response = await fetch(`${API_URL}/create-payment-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency || "zar",
      metadata: data.metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create payment intent");
  }

  return response.json();
};

