import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, CartItem } from '../types';

interface CartContextProps {
  cartItems: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('h_cart');
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (err) {
        console.warn('Error reading cart from local storage:', err);
      }
    }
  }, []);

  // Save to local storage
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem('h_cart', JSON.stringify(items));
  };

  const addToCart = (item: MenuItem) => {
    const existingIndex = cartItems.findIndex(ci => ci.menuItem.id === item.id);
    if (existingIndex > -1) {
      const nextCart = [...cartItems];
      nextCart[existingIndex].quantity += 1;
      saveCart(nextCart);
    } else {
      saveCart([...cartItems, { menuItem: item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    const existingIndex = cartItems.findIndex(ci => ci.menuItem.id === itemId);
    if (existingIndex > -1) {
      const nextCart = [...cartItems];
      if (nextCart[existingIndex].quantity > 1) {
        nextCart[existingIndex].quantity -= 1;
        saveCart(nextCart);
      } else {
        const filtered = cartItems.filter(ci => ci.menuItem.id !== itemId);
        saveCart(filtered);
      }
    }
  };

  const updateQuantity = (itemId: string, qty: number) => {
    if (qty <= 0) {
      const filtered = cartItems.filter(ci => ci.menuItem.id !== itemId);
      saveCart(filtered);
    } else {
      const nextCart = cartItems.map(ci => {
        if (ci.menuItem.id === itemId) {
          return { ...ci, quantity: qty };
        }
        return ci;
      });
      saveCart(nextCart);
    }
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((acc, ci) => {
      const activePrice = ci.menuItem.discountedPrice !== undefined && ci.menuItem.discountedPrice < ci.menuItem.regularPrice
        ? ci.menuItem.discountedPrice 
        : ci.menuItem.regularPrice;
      return acc + (activePrice * ci.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((acc, ci) => acc + ci.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
