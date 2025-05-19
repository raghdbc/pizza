import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Home, Truck, MapPin, Clock, Calendar, Smartphone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Checkout: React.FC = () => {
  const { cartItems, cartTotal, cartCalories, clearCart } = useCart();
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | null>(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: '',
    phone: profile?.phone || '',
    address: profile?.default_address || '',
    city: profile?.city || '',
    pincode: profile?.pincode || '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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

  const handleCardDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
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

  const validateCardDetails = () => {
    if (paymentMethod === 'card') {
      return (
        cardDetails.number.length === 16 &&
        cardDetails.expiry.length === 5 &&
        cardDetails.cvv.length === 3 &&
        cardDetails.name.length > 0
      );
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setShowPaymentModal(true);
    }
  };

  const processOrder = async () => {
    try {
      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: profile?.id,
            delivery_address: formData.address,
            city: formData.city,
            pincode: formData.pincode,
            total_amount: cartTotal + 40 + (cartTotal * 0.05),
            total_calories: cartCalories,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        pizza_name: item.pizza.name,
        pizza_size: item.pizza.size,
        crust: item.pizza.crust,
        sauce: item.pizza.sauce,
        toppings: item.pizza.toppings,
        quantity: item.quantity,
        price: item.totalPrice,
        calories: item.totalCalories
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create payment transaction
      const { error: paymentError } = await supabase
        .from('payment_transactions')
        .insert([
          {
            order_id: orderData.id,
            amount: cartTotal + 40 + (cartTotal * 0.05),
            status: 'completed',
            payment_method: paymentMethod,
            transaction_id: `TRANS${Date.now()}`
          }
        ]);

      if (paymentError) throw paymentError;

      // Update user profile if needed
      if (!profile?.default_address) {
        await updateProfile({
          default_address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          phone: formData.phone
        });
      }

      setOrderPlaced(true);
      clearCart();
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process order');
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === 'card' && !validateCardDetails()) {
      toast.error('Please fill in all card details correctly');
      return;
    }

    await processOrder();
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
              <div className="p-6">
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
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
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
              
              <button 
                onClick={handleSubmit}
                className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-full flex items-center justify-center space-x-2 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                <span>Proceed to Payment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Choose Payment Method</h3>
            
            <div className="space-y-4">
              {/* Card Payment Option */}
              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full p-4 rounded-lg border ${
                  paymentMethod === 'card'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 mr-3" />
                  <span>Credit/Debit Card</span>
                </div>
              </button>

              {/* UPI Payment Option */}
              <button
                onClick={() => setPaymentMethod('upi')}
                className={`w-full p-4 rounded-lg border ${
                  paymentMethod === 'upi'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Smartphone className="w-6 h-6 mr-3" />
                  <span>UPI Payment</span>
                </div>
              </button>

              {/* Card Details Form */}
              {paymentMethod === 'card' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Card Number</label>
                    <input
                      type="text"
                      name="number"
                      maxLength={16}
                      value={cardDetails.number}
                      onChange={handleCardDetailsChange}
                      placeholder="1234 5678 9012 3456"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                      <input
                        type="text"
                        name="expiry"
                        maxLength={5}
                        value={cardDetails.expiry}
                        onChange={handleCardDetailsChange}
                        placeholder="MM/YY"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        maxLength={3}
                        value={cardDetails.cvv}
                        onChange={handleCardDetailsChange}
                        placeholder="123"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name on Card</label>
                    <input
                      type="text"
                      name="name"
                      value={cardDetails.name}
                      onChange={handleCardDetailsChange}
                      placeholder="John Doe"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              )}

              {/* UPI QR Code */}
              {paymentMethod === 'upi' && (
                <div className="mt-4 text-center">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"
                    alt="UPI QR Code"
                    className="mx-auto w-48 h-48 mb-4"
                  />
                  <p className="text-sm text-gray-600 mb-4">
                    Scan this QR code with any UPI app to pay
                  </p>
                </div>
              )}

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-full"
              >
                {paymentMethod === 'card' ? 'Pay Now' : 'Confirm Payment'}
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod(null);
                }}
                className="w-full py-3 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;