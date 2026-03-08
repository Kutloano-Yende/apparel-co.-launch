import { supabase } from "@/integrations/supabase/client";

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
  const { data: response, error } = await supabase.functions.invoke(
    "create-payment-intent",
    {
      body: {
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency || "zar",
        metadata: data.metadata,
      },
    }
  );

  if (error) {
    throw new Error(error.message || "Failed to create payment intent");
  }

  if (response?.error) {
    throw new Error(response.error);
  }

  return response;
};
