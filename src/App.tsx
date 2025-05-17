import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PizzaProvider } from './context/PizzaContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Customize from './pages/Customize';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <PizzaProvider>
        <CartProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-green-50">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/customize" element={<Customize />} />
                  <Route path="/cart" element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  } />
                  <Route path="/checkout" element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Routes>
              </main>
              <Footer />
            </div>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#fff',
                  color: '#333',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                },
                success: {
                  iconTheme: {
                    primary: '#16a34a',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#dc2626',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </Router>
        </CartProvider>
      </PizzaProvider>
    </AuthProvider>
  );
}

export default App;