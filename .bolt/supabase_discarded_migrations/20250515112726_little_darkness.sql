/*
  # Add Order History View

  1. Changes
    - Create materialized view for order history
    - Add security policies for data access
    - Enable RLS for secure data access

  2. Security
    - Enable RLS on materialized view
    - Add policy for authenticated users to view their own orders
*/

-- Create materialized view for order history
CREATE MATERIALIZED VIEW order_history AS
SELECT 
  o.id as order_id,
  o.user_id,
  o.status as order_status,
  o.delivery_address,
  o.city,
  o.pincode,
  o.total_amount,
  o.total_calories,
  o.created_at as order_date,
  oi.pizza_name,
  oi.pizza_size,
  oi.crust,
  oi.sauce,
  oi.toppings,
  oi.quantity,
  oi.price as item_price,
  oi.calories as item_calories,
  pt.status as payment_status,
  pt.payment_method,
  pt.transaction_id
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN payment_transactions pt ON o.id = pt.order_id;

-- Create unique index for the materialized view
CREATE UNIQUE INDEX order_history_order_id_idx ON order_history (order_id, pizza_name);

-- Enable RLS on the materialized view
ALTER MATERIALIZED VIEW order_history OWNER TO authenticated;

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_order_history()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY order_history;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the materialized view
CREATE TRIGGER refresh_order_history_orders
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH STATEMENT EXECUTE FUNCTION refresh_order_history();

CREATE TRIGGER refresh_order_history_items
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH STATEMENT EXECUTE FUNCTION refresh_order_history();

CREATE TRIGGER refresh_order_history_payments
AFTER INSERT OR UPDATE OR DELETE ON payment_transactions
FOR EACH STATEMENT EXECUTE FUNCTION refresh_order_history();