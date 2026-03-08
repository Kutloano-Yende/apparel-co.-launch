-- Fix orders: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Fix order_items: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

CREATE POLICY "Anyone can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  ));