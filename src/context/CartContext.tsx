import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MarketplaceProduct } from '../types/marketplace';

interface CartItem {
  id: number;
  backendItemId?: number;
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
  addToCart: (product: MarketplaceProduct, quantity?: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => void;
  createCartOnBackend: () => Promise<number>;
  addItemToBackendCart: (productId: number, quantity: number) => Promise<number>;
  updateCartItem: (backendItemId: number, quantity: number) => Promise<void>;
  deleteCartItem: (backendItemId: number) => Promise<void>;
  updateCustomerLatLng: (lat: number, lng: number) => Promise<void>;
  createDelivery: (delivery: any) => Promise<void>;
  refreshCart: () => Promise<void>;
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

  const [backendTotals, setBackendTotals] = useState<{
    subtotal: number;
    shipping: number;
    total: number;
  } | null>(null);

  const createCartOnBackend = async (): Promise<number> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('http://3.110.179.122:8000/api/v1/carts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create cart');
      }

      const responseData = await response.json();
      setState(prev => ({ ...prev, cartId: responseData.id }));
      return responseData.id;
    } catch (error) {
      console.error('Cart creation failed:', error);
      throw error;
    }
  };

  const fetchMyCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://3.110.179.122:8000/api/v1/my-cart/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) {
        setCart([]);
        setBackendTotals(null);
        return;
      }

      const data = await response.json();
      setState(prev => ({ ...prev, cartId: data.id }));

      const mapped: CartItem[] = (data.items || []).map((it: any) => ({
        id: it.product,
        backendItemId: it.id,
        product: (it.product_details || {}) as MarketplaceProduct,
        quantity: it.quantity,
        price: parseFloat(String(it.unit_price)),
        image: it.product_details?.images?.[0]?.image || '',
        name: it.product_details?.name || 'Product',
      }));
      setCart(mapped);

      setBackendTotals({
        subtotal: parseFloat(String(data.subtotal ?? '0')),
        shipping: Number(data.shipping ?? 0),
        total: parseFloat(String(data.total ?? '0')),
      });
    } catch (error) {
      console.error('Failed to fetch my cart:', error);
    }
  };

  const addItemToBackendCart = async (productId: number, quantity: number): Promise<number> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      let backendCartId = state.cartId;
      if (!backendCartId) {
        backendCartId = await createCartOnBackend();
      }

      const response = await fetch(`http://3.110.179.122:8000/api/v1/carts/${backendCartId}/items/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to add item to cart');
      }

      const data = await response.json();
      return data?.id ?? 0;
    } catch (error) {
      console.error('Add item to cart failed:', error);
      throw error;
    }
  };

  const updateCartItem = async (backendItemId: number, quantity: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const backendCartId = state.cartId;
      if (!backendCartId) throw new Error('Cart not found');

      const response = await fetch(`http://3.110.179.122:8000/api/v1/carts/${backendCartId}/items/${backendItemId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ quantity })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update cart item');
      }
    } catch (error) {
      console.error('Update cart item failed:', error);
      throw error;
    }
  };

  const deleteCartItem = async (backendItemId: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const backendCartId = state.cartId;
      if (!backendCartId) throw new Error('Cart not found');

      const response = await fetch(`http://3.110.179.122:8000/api/v1/carts/${backendCartId}/items/${backendItemId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete cart item');
      }
    } catch (error) {
      console.error('Delete cart item failed:', error);
      throw error;
    }
  };

  const updateCustomerLatLng = async (lat: number, lng: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch('http://3.110.179.122:8000/api/v1/customer/location/', {
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

      const response = await fetch('http://3.110.179.122:8000/api/v1/deliveries/', {
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

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetchMyCart();
    } else {
      // If logged out, clear local cart and backend totals
      setCart([]);
      setBackendTotals(null);
      setState(prev => ({ ...prev, cartId: null }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToCart = async (product: MarketplaceProduct, quantity: number = 1) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please login to add items to cart');
    }

    try {
      const backendItemId = await addItemToBackendCart(product.id, quantity);

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
            backendItemId,
            product,
            quantity,
            price: parseFloat(product.discounted_price || product.listed_price),
            image: product.product_details?.images?.[0]?.image || '',
            name: product.product_details?.name || 'Product',
          },
        ];
      });

      fetchMyCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId: number) => {
    try {
      const cartItem = cart.find(item => item.id === productId);
      if (cartItem?.backendItemId) {
        await deleteCartItem(cartItem.backendItemId);
      } else {
        await fetchMyCart();
        const refreshed = cart.find(item => item.id === productId);
        if (refreshed?.backendItemId) {
          await deleteCartItem(refreshed.backendItemId);
        }
      }

      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      fetchMyCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    try {
      const cartItem = cart.find(item => item.id === productId);
      if (cartItem?.backendItemId) {
        await updateCartItem(cartItem.backendItemId, quantity);
      } else {
        await fetchMyCart();
        const refreshed = cart.find(item => item.id === productId);
        if (refreshed?.backendItemId) {
          await updateCartItem(refreshed.backendItemId, quantity);
        }
      }

      setCart(prevCart =>
        prevCart.map(item => (item.id === productId ? { ...item, quantity } : item))
      );
      fetchMyCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const computedSubTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const subTotal = backendTotals?.subtotal ?? computedSubTotal;
  const shipping = backendTotals?.shipping ?? (subTotal > 0 ? 100 : 0);
  const total = backendTotals?.total ?? (subTotal + shipping);

  const value: CartContextType = {
    cart,
    state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    createCartOnBackend,
    addItemToBackendCart,
    updateCartItem,
    deleteCartItem,
    updateCustomerLatLng,
    createDelivery,
    refreshCart: fetchMyCart,
    itemCount,
    subTotal,
    shipping,
    total,
  };

  return (
    <CartContext.Provider value={value}>
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
