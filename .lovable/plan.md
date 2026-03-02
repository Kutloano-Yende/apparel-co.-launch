

# Set Up Lovable Cloud for Authentication and Database

## Steps

1. **Enable Lovable Cloud** — Connect the project to get a working Supabase backend with real credentials.

2. **Create database migration** — Set up `profiles`, `orders`, and `order_items` tables with RLS policies and an auto-create profile trigger on user signup.

3. **Create AuthContext** — New `src/context/AuthContext.tsx` that listens to `onAuthStateChange`, provides user/profile state, and exposes login/signup/logout/updateProfile functions.

4. **Rewrite AccountPage** — Show login/signup when logged out; show account dashboard (profile settings + order history) when logged in. Include a password reset flow with a `/reset-password` route.

5. **Update Header** — Show logged-in user's name, add logout option.

6. **Update CheckoutPage** — Auto-fill shipping info from user profile when authenticated, link orders to `user_id`.

7. **Update App.tsx** — Wrap app with `AuthProvider`, add `/reset-password` route.

8. **Update supabase client** — Remove placeholder config, use real Lovable Cloud connection.

## Files Changed

| File | Action |
|------|--------|
| `src/lib/supabase.ts` | Update — real connection |
| `src/context/AuthContext.tsx` | New — auth state management |
| `src/pages/AccountPage.tsx` | Rewrite — dashboard + auth |
| `src/pages/ResetPasswordPage.tsx` | New — password reset |
| `src/components/Header.tsx` | Update — auth state in UI |
| `src/pages/CheckoutPage.tsx` | Update — auto-fill from profile |
| `src/App.tsx` | Update — AuthProvider + routes |
| Migration SQL | New — profiles, orders, order_items, RLS, trigger |

