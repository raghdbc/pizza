/*
  # Add Order History View

  1. New View
    - Creates a view to show user's order history with detailed information
    - Includes pizza details, order status, and payment information
    
  2. Security
    - Add RLS policy for the view to ensure users can only see their own orders
*/

-- Create order history view
CREATE VIEW order_history AS
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

-- Enable RLS on the view
ALTER VIEW order_history SET (security_invoker = true);

-- Create policy for the view
CREATE POLICY "Users can view own order history"
  ON order_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);