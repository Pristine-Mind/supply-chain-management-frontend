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
  distinctItemCount: number;
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

      const mapped: CartItem[] = (data.items || []).map((it: any) => {
        const listingId = Number(it.product);
        const pd = it.product_details?.product_details ?? it.product_details ?? {};

        const marketplaceProduct = {
          id: listingId,
          product: Number(pd.id ?? listingId),
          product_details: pd,
          listed_price: Number(it.unit_price ?? pd.price ?? 0),
          discounted_price: it.discounted_price ?? null,
          percent_off: it.percent_off ?? 0,
          savings_amount: it.savings_amount ?? 0,
          offer_start: it.offer_start ?? null,
          offer_end: it.offer_end ?? null,
          is_offer_active: it.is_offer_active ?? null,
          offer_countdown: it.offer_countdown ?? null,
          estimated_delivery_days: it.estimated_delivery_days ?? null,
          shipping_cost: String(it.shipping_cost ?? '0'),
          is_free_shipping: Boolean(it.is_free_shipping ?? false),
          recent_purchases_count: Number(it.recent_purchases_count ?? 0),
          listed_date: it.listed_date ?? new Date().toISOString(),
          is_available: Boolean(it.is_available ?? true),
          min_order: it.min_order ?? null,
          latitude: Number(it.latitude ?? 0),
          longitude: Number(it.longitude ?? 0),
          bulk_price_tiers: it.bulk_price_tiers ?? [],
          variants: it.variants ?? [],
          reviews: it.reviews ?? [],
          average_rating: Number(it.average_rating ?? 0),
          ratings_breakdown: it.ratings_breakdown ?? {},
          total_reviews: Number(it.total_reviews ?? 0),
          view_count: Number(it.view_count ?? 0),
          rank_score: Number(it.rank_score ?? 0),
        } as unknown as MarketplaceProduct;

        return {
          id: listingId,
          backendItemId: Number(it.id),
          product: marketplaceProduct,
          quantity: Number(it.quantity ?? 1),
          price: parseFloat(String(it.unit_price ?? marketplaceProduct.listed_price ?? 0)),
          image: pd?.images?.[0]?.image || '',
          name: pd?.name || 'Product',
        };
      });
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

      const url = `http://3.110.179.122:8000/api/v1/carts/${backendCartId}/items/`;
      console.debug('[Cart] addItemToBackendCart', { productId, quantity, url });
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          cart: backendCartId,
          product: productId,
          quantity: quantity,
        })
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('[Cart] addItemToBackendCart failed', response.status, text);
        let detail = '';
        try { detail = (JSON.parse(text) || {}).detail || text; } catch { detail = text; }
        throw new Error(detail || `Failed to add item to cart (HTTP ${response.status})`);
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
      const productIdForBackend = product.id;
      if (productIdForBackend == null || Number.isNaN(Number(productIdForBackend))) {
        console.error('[Cart] Invalid product id for backend', { product });
        throw new Error('Invalid product reference');
      }
      const backendItemId = await addItemToBackendCart(productIdForBackend, quantity);

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

  const distinctItemCount = cart.length;
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
    distinctItemCount,
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
