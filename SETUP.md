# Setup Guide for Payment and Database Integration

This guide will help you set up Stripe payments and Supabase database for your Apparel Co. store.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Stripe account (sign up at https://stripe.com)

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project

1. Go to https://supabase.com and create a new project
2. Note down your project URL and anon key from Settings > API

### 1.2 Set Up Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `supabase-schema.sql`
3. Run the SQL script to create the necessary tables

### 1.3 Configure Environment Variables

Create a `.env` file in the root of your project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 2: Stripe Setup

### 2.1 Get Your Stripe Keys

1. Go to https://dashboard.stripe.com
2. Navigate to Developers > API keys
3. Copy your Publishable key (starts with `pk_`)
4. Copy your Secret key (starts with `sk_`) - **Keep this secret!**

### 2.2 Add Stripe to Environment Variables

Add to your `.env` file:

```env
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

**Important:** Never expose your Stripe Secret key in the frontend. It should only be used in your backend API.

## Step 3: Backend API Setup

You need to create a backend API endpoint to securely create Stripe payment intents. Here's a simple example using Node.js/Express:

### Example Backend Endpoint

Create a file `server.js` (or use your preferred backend framework):

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'zar', metadata = {} } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3.1 Update API URL

If your backend runs on a different URL, update `src/lib/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
```

And add to your `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Step 4: Testing

### 4.1 Test Stripe Payments

Use Stripe's test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Use any future expiry date, any CVC, and any postal code

### 4.2 Test Supabase

1. Try creating an account on the `/account` page
2. Check your Supabase dashboard to see if the user was created
3. Try placing a test order and verify it appears in the `orders` table

## Security Notes

1. **Never commit your `.env` file** - Add it to `.gitignore`
2. **Stripe Secret Key** - Only use in backend, never in frontend
3. **Supabase Service Role Key** - Only use in backend for admin operations
4. **Row Level Security (RLS)** - The schema includes RLS policies. Review and adjust as needed

## Troubleshooting

### Payment Intent Creation Fails

- Check that your backend API is running
- Verify your Stripe secret key is correct
- Check browser console for errors

### Supabase Connection Issues

- Verify your Supabase URL and anon key are correct
- Check that the database schema was created successfully
- Review Supabase logs in the dashboard

### Authentication Issues

- Check Supabase authentication settings
- Verify email confirmation is configured (or disabled for testing)
- Review browser console for errors

## Next Steps

1. Set up email templates in Supabase for authentication emails
2. Configure webhooks in Stripe to handle payment status updates
3. Add order confirmation emails
4. Set up production environment variables
5. Configure CORS on your backend API for production domain

