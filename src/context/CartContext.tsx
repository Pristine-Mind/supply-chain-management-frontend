import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MarketplaceProduct } from '../types/marketplace';

interface CartItem {
  id: number;
  product: MarketplaceProduct;
  quantity: number;
  price: number;
  image: string;
  name: string;
}

export interface CartState {
  cartId: number | null;
}

interface CartContextType {
  cart: CartItem[];
  state: CartState;
  addToCart: (product: MarketplaceProduct, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  createCartOnBackend: () => Promise<void>;
  updateCustomerLatLng: (lat: number, lng: number) => Promise<void>;
  createDelivery: (delivery: any) => Promise<void>;
  itemCount: number;
  subTotal: number;
  shipping: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CartState>({
    cartId: null,
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  const createCartOnBackend = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('http://35.154.151.155:8000/api/v1/carts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ items: cart })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create cart');
      }

      const responseData = await response.json();
      setState(prev => ({ ...prev, cartId: responseData.id }));
      return responseData;
    } catch (error) {
      console.error('Cart creation failed:', error);
      throw error;
    }
  };

  const updateCustomerLatLng = async (lat: number, lng: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('http://35.154.151.155:8000/api/v1/customer/location/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update location');
      }

      return await response.json();
    } catch (error) {
      console.error('Location update failed:', error);
      throw error;
    }
  };

  const createDelivery = async (delivery: any): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('http://35.154.151.155:8000/api/v1/deliveries/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(delivery)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create delivery');
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Delivery creation failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = (product: MarketplaceProduct, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prevCart,
        {
          id: product.id,
          product,
          quantity,
          price: parseFloat(product.discounted_price || product.listed_price),
          image: product.product_details?.images[0]?.image || '',
          name: product.product_details?.name || 'Product',
        },
      ];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subTotal > 0 ? 100 : 0;
  const total = subTotal + shipping;

  return (
    <CartContext.Provider
      value={{
        cart,
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        createCartOnBackend,
        updateCustomerLatLng,
        createDelivery,
        itemCount,
        subTotal,
        shipping,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export { CartContext };

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
