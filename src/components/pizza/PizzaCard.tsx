import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LeafIcon, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Pizza } from '../../context/PizzaContext';
import { useCart } from '../../context/CartContext';

interface PizzaCardProps {
  pizza: Pizza;
  detailed?: boolean;
}

const PizzaCard: React.FC<PizzaCardProps> = ({ pizza, detailed = false }) => {
  const [quantity, setQuantity] = useState(1);
  const { calculatePizzaPrice, calculatePizzaCalories, addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(pizza, quantity);
    // Reset quantity after adding to cart
    setQuantity(1);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* Pizza Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={pizza.image} 
          alt={pizza.name} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {pizza.vegan && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
            <LeafIcon className="w-3 h-3 mr-1" />
            Vegan
          </div>
        )}
      </div>

      {/* Pizza Content */}
      <div className="p-4">
        <h3 className="text-xl font-semibold text-green-800">{pizza.name}</h3>
        
        <div className="mt-2 text-sm text-gray-600">
          {detailed ? (
            <p>{pizza.description}</p>
          ) : (
            <p>{pizza.description.slice(0, 80)}...</p>
          )}
        </div>

        {/* Nutrition & Price Info */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm font-medium">
            <div className="flex items-center text-green-700">
              <span className="mr-2">₹{calculatePizzaPrice(pizza)}</span>
              <span className="text-gray-500">|</span>
              <span className="ml-2">{calculatePizzaCalories(pizza)} Kcal</span>
            </div>
          </div>
          
          {detailed && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-700" />
              </button>
              <span className="font-medium">{quantity}</span>
              <button 
                onClick={() => setQuantity(prev => prev + 1)}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex space-x-2">
          {detailed ? (
            <button
              onClick={handleAddToCart}
              className="flex-grow py-2 bg-green-700 hover:bg-green-800 text-white rounded-full flex items-center justify-center space-x-2 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
          ) : (
            <>
              <Link 
                to={`/customize?id=${pizza.id}`}
                className="flex-grow py-2 bg-white border border-green-700 text-green-700 hover:bg-green-50 rounded-full text-center transition-colors"
              >
                Customize
              </Link>
              <button
                onClick={handleAddToCart}
                className="flex-grow py-2 bg-green-700 hover:bg-green-800 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                <span>Add</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PizzaCard;