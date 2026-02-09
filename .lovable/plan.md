

# Set Up Lovable Cloud for Authentication and Database

## What You'll Get
- Email/password user registration and login
- User profile storage (name, phone, address)
- Order history tracking tied to logged-in users
- Account dashboard showing past orders and profile settings
- Protected routes (checkout auto-fills user info when logged in)
- Logout functionality in the header

## Steps

### Step 1: Enable Lovable Cloud
Connect the project to Lovable Cloud to get a working Supabase backend. This replaces the current placeholder configuration in the supabase client.

### Step 2: Create Database Tables
Set up the following tables via migrations:

- **profiles** -- stores user profile data (first name, last name, phone, default address), linked to auth.users with auto-creation trigger
- **orders** -- stores completed orders linked to user_id
- **order_items** -- stores individual items within each order

### Step 3: Set Up Row-Level Security (RLS)
- Users can only read/update their own profile
- Users can view their own orders and order items
- Anyone can create orders (supports guest checkout)
- Auto-create profile on signup via database trigger

### Step 4: Create Auth Context
Build an `AuthContext` provider that:
- Listens for auth state changes via `onAuthStateChange`
- Provides current user, profile data, loading state
- Exposes login, signup, logout, and update profile functions
- Wraps the entire app

### Step 5: Update Account Page
Transform the current login/signup page into a full account experience:
- **Logged out**: Show login/signup form (existing UI, refined)
- **Logged in**: Show account dashboard with:
  - Profile settings (edit name, phone, address)
  - Order history list (date, status, total, items)
  - Logout button

### Step 6: Update Header
- Show user's name or "Account" when logged in
- Add logout option
- Visual indicator of logged-in state

### Step 7: Update Checkout
- Auto-fill email and shipping info from user profile when logged in
- Link orders to user_id when authenticated
- Save shipping address to profile option

### Step 8: Update Supabase Client
Replace the placeholder configuration with the real Lovable Cloud connection.

---

## Technical Details

### Database Schema (Migrations)

**profiles table:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  default_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**orders and order_items** will use the existing schema from `supabase-schema.sql`, adjusted to reference profiles.

**RLS policies:**
- profiles: Users read/update own row only
- orders: Users read own orders; anyone can insert
- order_items: Users read items for own orders; anyone can insert

### New/Modified Files

| File | Action |
|------|--------|
| `src/context/AuthContext.tsx` | New -- auth state management |
| `src/pages/AccountPage.tsx` | Rewrite -- dashboard with profile + order history |
| `src/components/Header.tsx` | Update -- show auth state, logout |
| `src/pages/CheckoutPage.tsx` | Update -- auto-fill from profile |
| `src/App.tsx` | Update -- wrap with AuthProvider |
| `src/lib/supabase.ts` | Update -- remove placeholder, use real connection |

### Auth Flow
1. User signs up with email, password, first name, last name
2. Trigger auto-creates profile row
3. `onAuthStateChange` fires, AuthContext loads profile
4. User redirected to account dashboard
5. On login, same flow minus trigger
6. Checkout auto-fills from profile data
7. Orders saved with user_id, visible in order history

