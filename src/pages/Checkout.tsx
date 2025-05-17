import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Home, Truck, MapPin, Clock, Calendar } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { stripePromise, createPaymentIntent } from '../lib/stripe';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Payment Form Component
const PaymentForm = ({ clientSecret }: { clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'An error occurred');
      setProcessing(false);
    } else {
      // Payment successful
      clearCart();
      navigate('/order-confirmation');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className={`w-full mt-4 py-3 bg-green-700 hover:bg-green-800 text-white rounded-full flex items-center justify-center space-x-2 transition-colors ${
          processing ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

const Checkout: React.FC = () => {
  const { cartItems, cartTotal, cartCalories, clearCart } = useCart();
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: '',
    phone: profile?.phone || '',
    address: profile?.default_address || '',
    city: profile?.city || '',
    pincode: profile?.pincode || '',
    paymentMethod: 'cod', // cod or online
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (formData.paymentMethod === 'online') {
      initializePayment();
    }
  }, [formData.paymentMethod]);

  const initializePayment = async () => {
    try {
      const totalAmount = cartTotal + 40 + (cartTotal * 0.05);
      // Convert amount to cents and ensure it's an integer
      const amountInCents = Math.round(totalAmount * 100);
      const { clientSecret } = await createPaymentIntent(amountInCents);
      setClientSecret(clientSecret);
    } catch (error) {
      console.error('Error initializing payment:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    setFormData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createOrder = async () => {
    if (!user?.id) return false;

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          delivery_address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          total_amount: cartTotal + 40 + cartTotal * 0.05,
          total_calories: cartCalories,
          status: formData.paymentMethod === 'cod' ? 'pending' : 'processing'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        pizza_name: item.pizza.name,
        pizza_size: item.pizza.size,
        crust: item.pizza.crust,
        sauce: item.pizza.sauce,
        toppings: item.pizza.toppings,
        quantity: item.quantity,
        price: item.totalPrice,
        calories: item.totalCalories,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create payment transaction
      const { error: paymentError } = await supabase
        .from('payment_transactions')
        .insert({
          order_id: order.id,
          amount: cartTotal + 40 + cartTotal * 0.05,
          payment_method: formData.paymentMethod,
          status: formData.paymentMethod === 'cod' ? 'pending' : 'processing',
        });

      if (paymentError) throw paymentError;

      // Update user profile if needed
      if (
        formData.address !== profile?.default_address ||
        formData.city !== profile?.city ||
        formData.pincode !== profile?.pincode
      ) {
        await updateProfile({
          name: formData.name,
          phone: formData.phone,
          default_address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
        });
      }

      return true;
    } catch (error) {
      console.error('Error creating order:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      if (formData.paymentMethod === 'cod') {
        const success = await createOrder();
        if (success) {
          setOrderPlaced(true);
          clearCart();
          navigate('/order-confirmation');
        }
      } else if (formData.paymentMethod === 'online' && clientSecret) {
        // Payment will be handled by Stripe Elements
        return;
      }
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-green-50 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your order. Your healthy pizzas will be delivered soon.
            </p>
            <div className="bg-green-50 rounded-lg p-4 mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-medium">#NW{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Estimated Delivery:</span>
                <span className="font-medium">30-45 minutes</span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white rounded-full font-medium transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">Checkout</h1>
          <p className="text-gray-600">
            Complete your order by providing delivery and payment details.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Contact Information */}
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && <p className="mt-1 text-red-500 text-sm">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.phone && <p className="mt-1 text-red-500 text-sm">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Delivery Address</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-gray-700 mb-1">Address</label>
                    <textarea
                      id="address"
                      name="address"
                      rows={2}
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.address && <p className="mt-1 text-red-500 text-sm">{errors.address}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.city && <p className="mt-1 text-red-500 text-sm">{errors.city}</p>}
                    </div>
                    <div>
                      <label htmlFor="pincode" className="block text-gray-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent ${
                          errors.pincode ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.pincode && <p className="mt-1 text-red-500 text-sm">{errors.pincode}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <div
                    onClick={() => handlePaymentMethodChange('cod')}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      formData.paymentMethod === 'cod'
                        ? 'border-green-700 bg-green-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        formData.paymentMethod === 'cod' 
                          ? 'border-green-700' 
                          : 'border-gray-400'
                      }`}>
                        {formData.paymentMethod === 'cod' && (
                          <div className="w-3 h-3 bg-green-700 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Home className="w-5 h-5 text-gray-700 mr-2" />
                        <span className="font-medium">Cash on Delivery</span>
                      </div>
                    </div>
                  </div>
                  <div
                    onClick={() => handlePaymentMethodChange('online')}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      formData.paymentMethod === 'online'
                        ? 'border-green-700 bg-green-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        formData.paymentMethod === 'online' 
                          ? 'border-green-700' 
                          : 'border-gray-400'
                      }`}>
                        {formData.paymentMethod === 'online' && (
                          <div className="w-3 h-3 bg-green-700 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="w-5 h-5 text-gray-700 mr-2" />
                        <span className="font-medium">Pay Online</span>
                      </div>
                    </div>
                  </div>

                  {formData.paymentMethod === 'online' && clientSecret && (
                    <div className="mt-4">
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm clientSecret={clientSecret} />
                      </Elements>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({cartItems.length})</span>
                  <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium">₹40.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (5%)</span>
                  <span className="font-medium">₹{(cartTotal * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-4 border-t">
                  <span className="text-lg font-medium">Total</span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-800">
                      ₹{(cartTotal + 40 + cartTotal * 0.05).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({cartCalories} Kcal)
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <Truck className="w-5 h-5 text-green-700 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Fast Delivery</h3>
                    <p className="text-sm text-gray-600">30-45 minutes estimated</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-green-700 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Delivery Tracking</h3>
                    <p className="text-sm text-gray-600">Real-time updates on your order</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-green-700 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Contactless Delivery</h3>
                    <p className="text-sm text-gray-600">Safe and hygienic handling</p>
                  </div>
                </div>
              </div>
              
              {formData.paymentMethod === 'cod' && (
                <button 
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-full flex items-center justify-center space-x-2 transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Place Order</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;