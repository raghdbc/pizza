/*
  # Add admin role and policies

  1. Changes
    - Add admin role check function
    - Update existing policies to allow admin access
    - Add new admin-specific policies
*/

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND email LIKE '%@natureswheel.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update orders policies to include admin access
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR is_admin(auth.uid())
  );

-- Add update policy for orders (admin only)
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Update order_items policies
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

-- Update payment_transactions policies
DROP POLICY IF EXISTS "Users can view own payment transactions" ON payment_transactions;
CREATE POLICY "Users can view payment transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_transactions.order_id
      AND (orders.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );