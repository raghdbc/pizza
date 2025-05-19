import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Pizza, usePizza, Crust, Sauce, Size, Topping } from './PizzaContext';

interface CartItem {
  id: string;
  pizza: Pizza;
  quantity: number;
  totalPrice: number;
  totalCalories: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (pizza: Pizza, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCalories: number;
  calculatePizzaPrice: (pizza: Pizza) => number;
  calculatePizzaCalories: (pizza: Pizza) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCalories, setCartCalories] = useState(0);
  const { toppings, crusts, sauces, sizes } = usePizza();

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
      const total = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const calories = cartItems.reduce((sum, item) => sum + item.totalCalories, 0);
      setCartTotal(total);
      setCartCalories(calories);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cartItems]);

  const calculatePizzaPrice = (pizza: Pizza) => {
    const pizzaSize = sizes.find(s => s.id === pizza.size) as Size;
    const pizzaCrust = crusts.find(c => c.id === pizza.crust) as Crust;
    const pizzaSauce = sauces.find(s => s.id === pizza.sauce) as Sauce;
    
    let totalPrice = pizza.basePrice * pizzaSize.multiplier;
    totalPrice += pizzaCrust.price;
    totalPrice += pizzaSauce.price;
    
    pizza.toppings.forEach(topping => {
      const toppingData = toppings.find(t => t.id === topping.id) as Topping;
      totalPrice += toppingData.pricePerGram * topping.quantity;
    });
    
    if (pizza.id.startsWith('custom-')) {
      totalPrice *= 1.2;
    }
    
    return parseFloat(totalPrice.toFixed(2));
  };

  const calculatePizzaCalories = (pizza: Pizza) => {
    const pizzaSize = sizes.find(s => s.id === pizza.size) as Size;
    const pizzaCrust = crusts.find(c => c.id === pizza.crust) as Crust;
    const pizzaSauce = sauces.find(s => s.id === pizza.sauce) as Sauce;
    
    let totalCalories = pizza.baseCalories * pizzaSize.caloriesMultiplier;
    totalCalories += pizzaCrust.calories;
    totalCalories += pizzaSauce.calories;
    
    pizza.toppings.forEach(topping => {
      const toppingData = toppings.find(t => t.id === topping.id) as Topping;
      totalCalories += toppingData.calories * topping.quantity / 10;
    });
    
    return Math.round(totalCalories);
  };

  const addToCart = (pizza: Pizza, quantity: number) => {
    try {
      const totalPrice = calculatePizzaPrice(pizza) * quantity;
      const totalCalories = calculatePizzaCalories(pizza) * quantity;
      
      const existingItemIndex = cartItems.findIndex(item => 
        item.pizza.id === pizza.id &&
        item.pizza.crust === pizza.crust &&
        item.pizza.sauce === pizza.sauce &&
        item.pizza.size === pizza.size &&
        JSON.stringify(item.pizza.toppings) === JSON.stringify(pizza.toppings)
      );
      
      if (existingItemIndex !== -1) {
        const updatedItems = [...cartItems];
        const existingItem = updatedItems[existingItemIndex];
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
          totalPrice: existingItem.totalPrice + totalPrice,
          totalCalories: existingItem.totalCalories + totalCalories
        };
        
        setCartItems(updatedItems);
        toast.success(`Updated ${pizza.name} quantity in cart`);
      } else {
        const newItem: CartItem = {
          id: `${pizza.id}-${Date.now()}`,
          pizza,
          quantity,
          totalPrice,
          totalCalories
        };
        
        setCartItems(prev => [...prev, newItem]);
        toast.success(`Added ${pizza.name} to cart`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const removeFromCart = (itemId: string) => {
    try {
      const itemToRemove = cartItems.find(item => item.id === itemId);
      if (itemToRemove) {
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        toast.success(`Removed ${itemToRemove.pizza.name} from cart`);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        removeFromCart(itemId);
        return;
      }
      
      const updatedItems = cartItems.map(item => {
        if (item.id === itemId) {
          const pizzaPrice = calculatePizzaPrice(item.pizza);
          const pizzaCalories = calculatePizzaCalories(item.pizza);
          
          return {
            ...item,
            quantity,
            totalPrice: pizzaPrice * quantity,
            totalCalories: pizzaCalories * quantity
          };
        }
        return item;
      });
      
      setCartItems(updatedItems);
      toast.success('Cart updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const clearCart = () => {
    try {
      setCartItems([]);
      localStorage.removeItem('cart');
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCalories,
        calculatePizzaPrice,
        calculatePizzaCalories
      }}
    >
      {children}
    </CartContext.Provider>
  );
};