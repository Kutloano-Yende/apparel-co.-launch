CREATE OR REPLACE FUNCTION public.track_order(_order_id uuid, _email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', o.id,
    'email', o.email,
    'status', o.status,
    'total_amount', o.total_amount,
    'shipping_cost', o.shipping_cost,
    'shipping_address', o.shipping_address,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'order_items', (
      SELECT json_agg(json_build_object(
        'id', oi.id,
        'product_name', oi.product_name,
        'product_image', oi.product_image,
        'size', oi.size,
        'color', oi.color,
        'quantity', oi.quantity,
        'price', oi.price
      ))
      FROM order_items oi
      WHERE oi.order_id = o.id
    )
  ) INTO result
  FROM orders o
  WHERE o.id = _order_id AND lower(o.email) = lower(_email);

  RETURN result;
END;
$$;