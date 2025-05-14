import { Pizza, Topping, Crust, Sauce, Size } from '../context/PizzaContext';

// Size options
export const sizes: Size[] = [
  {
    id: 'small',
    name: 'Small',
    multiplier: 0.8,
    caloriesMultiplier: 0.8
  },
  {
    id: 'medium',
    name: 'Medium',
    multiplier: 1,
    caloriesMultiplier: 1
  },
  {
    id: 'large',
    name: 'Large',
    multiplier: 1.3,
    caloriesMultiplier: 1.2
  }
];

// Crust options
export const crustsData: Crust[] = [
  {
    id: 'ragi',
    name: 'Ragi Thin Crust',
    calories: 120,
    price: 50,
    description: 'Made with nutritious ragi (finger millet) flour'
  },
  {
    id: 'wheat',
    name: 'Whole Wheat',
    calories: 150,
    price: 40,
    description: 'Wholesome crust made with 100% whole wheat flour'
  },
  {
    id: 'beetroot',
    name: 'Beetroot Crust',
    calories: 140,
    price: 60,
    description: 'Colorful and nutritious with real beetroot'
  },
  {
    id: 'multigrain',
    name: 'Multigrain',
    calories: 160,
    price: 55,
    description: 'Blend of seven healthy grains'
  }
];

// Sauce options
export const saucesData: Sauce[] = [
  {
    id: 'tomato',
    name: 'Fresh Tomato',
    calories: 30,
    price: 20
  },
  {
    id: 'pesto',
    name: 'Basil Pesto',
    calories: 70,
    price: 40
  },
  {
    id: 'hummus',
    name: 'Hummus Base',
    calories: 90,
    price: 45
  },
  {
    id: 'yogurt',
    name: 'Mint Yogurt',
    calories: 50,
    price: 35
  }
];

// Topping options
export const toppingsData: Topping[] = [
  {
    id: 'cheese',
    name: 'Low-Fat Mozzarella',
    calories: 90,
    pricePerGram: 0.8,
    vegan: false
  },
  {
    id: 'vegan-cheese',
    name: 'Vegan Cheese',
    calories: 80,
    pricePerGram: 1.0,
    vegan: true
  },
  {
    id: 'mushrooms',
    name: 'Mushrooms',
    calories: 20,
    pricePerGram: 0.6,
    vegan: true
  },
  {
    id: 'spinach',
    name: 'Fresh Spinach',
    calories: 10,
    pricePerGram: 0.4,
    vegan: true
  },
  {
    id: 'tomatoes',
    name: 'Cherry Tomatoes',
    calories: 15,
    pricePerGram: 0.5,
    vegan: true
  },
  {
    id: 'bell-peppers',
    name: 'Bell Peppers',
    calories: 12,
    pricePerGram: 0.5,
    vegan: true
  },
  {
    id: 'onions',
    name: 'Red Onions',
    calories: 18,
    pricePerGram: 0.3,
    vegan: true
  },
  {
    id: 'olives',
    name: 'Black Olives',
    calories: 30,
    pricePerGram: 0.7,
    vegan: true
  },
  {
    id: 'corn',
    name: 'Sweet Corn',
    calories: 25,
    pricePerGram: 0.4,
    vegan: true
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    calories: 15,
    pricePerGram: 0.5,
    vegan: true
  },
  {
    id: 'paneer',
    name: 'Paneer Cubes',
    calories: 75,
    pricePerGram: 0.9,
    vegan: false
  },
  {
    id: 'tofu',
    name: 'Tofu',
    calories: 40,
    pricePerGram: 0.7,
    vegan: true
  },
  {
    id: 'chicken',
    name: 'Grilled Chicken',
    calories: 85,
    pricePerGram: 1.0,
    vegan: false
  },
  {
    id: 'avocado',
    name: 'Avocado Slices',
    calories: 65,
    pricePerGram: 1.1,
    vegan: true
  },
  {
    id: 'arugula',
    name: 'Arugula',
    calories: 8,
    pricePerGram: 0.5,
    vegan: true
  }
];

// Pre-made pizzas
export const pizzaData: Pizza[] = [
  {
    id: 'veggie-delight',
    name: 'Veggie Delight',
    description: 'A colorful mix of bell peppers, mushrooms, spinach, and cherry tomatoes on our signature whole wheat crust.',
    image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg',
    basePrice: 250,
    baseCalories: 180,
    toppings: [
      { id: 'cheese', quantity: 30 },
      { id: 'mushrooms', quantity: 20 },
      { id: 'spinach', quantity: 15 },
      { id: 'tomatoes', quantity: 20 },
      { id: 'bell-peppers', quantity: 20 }
    ],
    crust: 'wheat',
    sauce: 'tomato',
    size: 'medium',
    vegan: false,
    featured: true
  },
  {
    id: 'protein-powerhouse',
    name: 'Protein Powerhouse',
    description: 'For fitness enthusiasts! Loaded with grilled chicken, tofu, and paneer on a multigrain crust for that protein boost.',
    image: 'https://images.pexels.com/photos/905847/pexels-photo-905847.jpeg',
    basePrice: 320,
    baseCalories: 220,
    toppings: [
      { id: 'cheese', quantity: 30 },
      { id: 'chicken', quantity: 40 },
      { id: 'tofu', quantity: 30 },
      { id: 'paneer', quantity: 30 },
      { id: 'bell-peppers', quantity: 15 }
    ],
    crust: 'multigrain',
    sauce: 'tomato',
    size: 'medium',
    vegan: false,
    featured: false
  },
  {
    id: 'ragi-special',
    name: 'Ragi Special',
    description: 'Our signature ragi crust topped with mushrooms, corn, and bell peppers. A calcium-rich, healthy option.',
    image: 'https://images.pexels.com/photos/7813549/pexels-photo-7813549.jpeg',
    basePrice: 280,
    baseCalories: 200,
    toppings: [
      { id: 'cheese', quantity: 25 },
      { id: 'mushrooms', quantity: 25 },
      { id: 'corn', quantity: 20 },
      { id: 'bell-peppers', quantity: 20 }
    ],
    crust: 'ragi',
    sauce: 'tomato',
    size: 'medium',
    vegan: false,
    featured: true
  },
  {
    id: 'vegan-supreme',
    name: 'Vegan Supreme',
    description: 'A plant-based delight with vegan cheese, avocado, and a medley of fresh vegetables on our beetroot crust.',
    image: 'https://images.pexels.com/photos/845802/pexels-photo-845802.jpeg',
    basePrice: 300,
    baseCalories: 190,
    toppings: [
      { id: 'vegan-cheese', quantity: 30 },
      { id: 'avocado', quantity: 25 },
      { id: 'mushrooms', quantity: 20 },
      { id: 'spinach', quantity: 15 },
      { id: 'bell-peppers', quantity: 15 },
      { id: 'olives', quantity: 15 }
    ],
    crust: 'beetroot',
    sauce: 'pesto',
    size: 'medium',
    vegan: true,
    featured: true
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    description: 'A taste of the Mediterranean with olives, cherry tomatoes, and feta on a hummus base with our whole wheat crust.',
    image: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg',
    basePrice: 290,
    baseCalories: 210,
    toppings: [
      { id: 'cheese', quantity: 25 },
      { id: 'olives', quantity: 20 },
      { id: 'tomatoes', quantity: 25 },
      { id: 'onions', quantity: 15 }
    ],
    crust: 'wheat',
    sauce: 'hummus',
    size: 'medium',
    vegan: false,
    featured: false
  },
  {
    id: 'green-garden',
    name: 'Green Garden',
    description: 'A garden-fresh experience with broccoli, spinach, avocado, and arugula on our multigrain crust with pesto sauce.',
    image: 'https://images.pexels.com/photos/5792329/pexels-photo-5792329.jpeg',
    basePrice: 270,
    baseCalories: 180,
    toppings: [
      { id: 'cheese', quantity: 20 },
      { id: 'broccoli', quantity: 20 },
      { id: 'spinach', quantity: 20 },
      { id: 'avocado', quantity: 20 },
      { id: 'arugula', quantity: 15 }
    ],
    crust: 'multigrain',
    sauce: 'pesto',
    size: 'medium',
    vegan: false,
    featured: false
  },
  {
    id: 'beetroot-bliss',
    name: 'Beetroot Bliss',
    description: 'Our vibrant beetroot crust topped with cherry tomatoes, corn, and bell peppers for a colorful, antioxidant-rich pizza.',
    image: 'https://images.pexels.com/photos/2233348/pexels-photo-2233348.jpeg',
    basePrice: 280,
    baseCalories: 200,
    toppings: [
      { id: 'vegan-cheese', quantity: 25 },
      { id: 'tomatoes', quantity: 25 },
      { id: 'corn', quantity: 20 },
      { id: 'bell-peppers', quantity: 20 }
    ],
    crust: 'beetroot',
    sauce: 'tomato',
    size: 'medium',
    vegan: true,
    featured: false
  },
  {
    id: 'paneer-tikka',
    name: 'Paneer Tikka',
    description: 'A fusion pizza with spiced paneer cubes, bell peppers, and onions on our whole wheat crust with yogurt sauce.',
    image: 'https://images.pexels.com/photos/1166120/pexels-photo-1166120.jpeg',
    basePrice: 310,
    baseCalories: 230,
    toppings: [
      { id: 'cheese', quantity: 25 },
      { id: 'paneer', quantity: 40 },
      { id: 'bell-peppers', quantity: 20 },
      { id: 'onions', quantity: 15 }
    ],
    crust: 'wheat',
    sauce: 'yogurt',
    size: 'medium',
    vegan: false,
    featured: false
  }
];