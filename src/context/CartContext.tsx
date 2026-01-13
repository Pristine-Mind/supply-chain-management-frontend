import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from './ToastContext';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  created_at: string;
}

interface ProductDetails {
  id: number;
  name: string;
  description: string;
  images: ProductImage[];
  category_details: string;
  category: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_marketplace_created: boolean;
  avg_daily_demand: number;
  stddev_daily_demand: number;
  safety_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  lead_time_days: number;
  projected_stockout_date_field: string | null;
  producer: any;
  user: number;
  location: number;
}

interface MarketplaceProduct {
  id: number;
  product: number;
  product_details: ProductDetails;
  discounted_price: number | null;
  listed_price: number;
  percent_off: number;
  savings_amount: number;
  offer_start: string | null;
  offer_end: string | null;
  is_offer_active: boolean | null;
  offer_countdown: string | null;
  estimated_delivery_days: number | null;
  shipping_cost: string;
  is_free_shipping: boolean;
  recent_purchases_count: number;
  listed_date: string;
  is_available: boolean;
  min_order: number | null;
  latitude: number;
  longitude: number;
  bulk_price_tiers: any[];
  variants: any[];
  reviews: any[];
  average_rating: number;
  ratings_breakdown: {
    [key: string]: number;
  };
  total_reviews: number;
  view_count: number;
  rank_score: number;
  b2b_price?: number | null;
  b2b_min_quantity?: number | null;
  is_b2b_eligible?: boolean;
}

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
  isLoading: boolean;
  error: string | null;
  addToCart: (product: MarketplaceProduct, quantity?: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<{ success: boolean; failedItems?: number[] }>;
  createCartOnBackend: () => Promise<number>;
  addItemToBackendCart: (productId: number, quantity: number) => Promise<number>;
  updateCartItem: (backendItemId: number, quantity: number) => Promise<void>;
  deleteCartItem: (backendItemId: number) => Promise<void>;
  updateCustomerLatLng: (lat: number, lng: number) => Promise<void>;
  createDelivery: (delivery: any) => Promise<void>;
  refreshCart: () => Promise<void>;
  clearError: () => void;
  distinctItemCount: number;
  itemCount: number;
  subTotal: number;
  shipping: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Import at the module level and create a safe wrapper
  let toast: any = null;
  try {
    toast = useToast();
  } catch (error) {
    // Toast context not available, we'll use console logging as fallback
    console.warn('Toast context not available in CartProvider');
  }
  
  const [state, setState] = useState<CartState>({
    cartId: null,
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      try {
        return savedCart ? JSON.parse(savedCart) : [];
      } catch {
        localStorage.removeItem('cart');
        return [];
      }
    }
    return [];
  });

  const [backendTotals, setBackendTotals] = useState<{
    subtotal: number;
    shipping: number;
    total: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const handleApiError = (error: any, operation: string) => {
    console.error(`${operation} failed:`, error);
    if (error.message?.includes('Authentication') || error.message?.includes('401')) {
      setError('Please login again to continue');
      // Clear cart on auth error
      setCart([]);
      setState(prev => ({ ...prev, cartId: null }));
    } else if (error.message?.includes('Network') || !navigator.onLine) {
      setError('Network error. Please check your connection and try again.');
    } else {
      setError(error.message || `Failed to ${operation.toLowerCase()}`);
    }
  };

  const createCartOnBackend = async (): Promise<number> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/carts/`, {
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

      const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/my-cart/`, {
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

      const mapped: CartItem[] = (data.items || [])
        .filter((it: any) => Number(it.quantity ?? 1) > 0)
        .map((it: any) => {
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
          // Include B2B fields
          b2b_price: it.b2b_price ?? null,
          b2b_min_quantity: it.b2b_min_quantity ?? null,
          is_b2b_eligible: Boolean(it.is_b2b_eligible ?? false),
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

      const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/carts/${backendCartId}/items/`;
      console.debug('[Cart] addItemToBackendCart', { productId, quantity, url, token: token?.substring(0, 10) + '...' });
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

      const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/carts/${backendCartId}/items/${backendItemId}/`, {
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

      let response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/carts/${backendCartId}/items/${backendItemId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok && response.status === 405) {
        response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/carts/${backendCartId}/items/${backendItemId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({ quantity: 0 })
        });
      }

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

      const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/customer/location/`, {
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

      const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/deliveries/`, {
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

  // Clean up cart items with zero quantity
  useEffect(() => {
    setCart(prevCart => prevCart.filter(item => item.quantity > 0));
  }, []);

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
    setError(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
      const error = new Error('Please login to add items to cart');
      handleApiError(error, 'Add to cart');
      throw error;
    }

    // Validate inputs
    if (!product || quantity <= 0) {
      const error = new Error('Invalid product or quantity');
      setError(error.message);
      throw error;
    }

    const productIdForBackend = product.id;
    if (productIdForBackend == null || Number.isNaN(Number(productIdForBackend))) {
      console.error('[Cart] Invalid product id for backend', { product });
      const error = new Error('Invalid product reference');
      setError(error.message);
      throw error;
    }

    // Optimistic update
    const tempId = Date.now();
    
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
          backendItemId: tempId, // Temporary ID
          product,
          quantity,
          price: product.discounted_price || product.listed_price,
          image: product.product_details?.images?.[0]?.image || '',
          name: product.product_details?.name || 'Product',
        },
      ];
    });

    try {
      const backendItemId = await addItemToBackendCart(productIdForBackend, quantity);
      
      // Update with real backend ID
      setCart(prevCart => 
        prevCart.map(item => 
          item.backendItemId === tempId 
            ? { ...item, backendItemId }
            : item
        )
      );

      // Show success toast
      if (toast) {
        toast.showCartSuccess(
          'Added to cart!',
          `${product.product_details?.name} (${quantity}) has been added to your cart.`,
          {
            label: 'View Cart',
            onClick: () => {
              // This will be handled by the component calling addToCart
              window.location.href = '/cart';
            }
          }
        );
      }

      // Refresh cart data after a short delay to ensure backend is updated
      setTimeout(() => {
        fetchMyCart().catch(console.error);
      }, 100);
    } catch (error) {
      // Rollback optimistic update
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === product.id);
        if (existingItem && existingItem.quantity > quantity) {
          return prevCart.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity - quantity }
              : item
          );
        }
        return prevCart.filter(item => item.backendItemId !== tempId);
      });
      
      // Show error toast
      if (toast) {
        toast.showError(
          'Failed to add to cart',
          error instanceof Error ? error.message : 'Please try again.'
        );
      }
      
      handleApiError(error, 'Add to cart');
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

      const removedItem = cart.find(item => item.id === productId);
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
      
      // Show removal toast
      if (removedItem && toast) {
        toast.showInfo(
          'Removed from cart',
          `${removedItem.name} has been removed from your cart.`
        );
      }
      
      fetchMyCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      if (toast) {
        toast.showError(
          'Error',
          'Failed to remove item from cart. Please try again.'
        );
      }
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

  const clearCart = async (): Promise<{ success: boolean; failedItems?: number[] }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // If not authenticated, just clear local cart
        setCart([]);
        localStorage.removeItem('cart');
        setIsLoading(false);
        return { success: true };
      }

      // Clear all items from backend cart with detailed error tracking
      const currentCart = [...cart];
      const failedItems: number[] = [];
      const deletePromises = currentCart.map(async (item) => {
        if (item.backendItemId) {
          try {
            await deleteCartItem(item.backendItemId);
            return { success: true, itemId: item.id };
          } catch (error) {
            console.error(`Failed to delete item ${item.backendItemId}:`, error);
            failedItems.push(item.id);
            return { success: false, itemId: item.id, error };
          }
        }
        return { success: true, itemId: item.id };
      });

      // Wait for all delete operations to complete
      const results = await Promise.allSettled(deletePromises);
      
      // Check for any failed operations
      const hasFailures = results.some(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && !result.value.success)
      );

      if (hasFailures && failedItems.length > 0) {
        // Partial failure - only clear successfully deleted items
        setCart(prevCart => prevCart.filter(item => failedItems.includes(item.id)));
        setError(`Failed to remove ${failedItems.length} item(s). Please try again.`);
        setIsLoading(false);
        return { success: false, failedItems };
      }

      // All items cleared successfully
      setCart([]);
      setBackendTotals(null);
      localStorage.removeItem('cart');
      
      // Show success toast
      if (toast) {
        toast.showSuccess(
          'Cart cleared',
          'All items have been removed from your cart.'
        );
      }
      
      // Refresh cart to ensure sync (but don't wait for it to complete)
      fetchMyCart().catch(error => {
        console.error('Failed to refresh cart after clearing:', error);
      });
      
      setIsLoading(false);
      return { success: true };
      
    } catch (error) {
      handleApiError(error, 'Clear cart');
      // Still clear local cart even if backend fails completely
      setCart([]);
      localStorage.removeItem('cart');
      setIsLoading(false);
      return { success: false };
    }
  };

  const distinctItemCount = cart.filter(item => item.quantity > 0).length;
  const itemCount = cart.filter(item => item.quantity > 0).reduce((count, item) => count + item.quantity, 0);
  const computedSubTotal = cart.filter(item => item.quantity > 0).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const subTotal = backendTotals?.subtotal ?? computedSubTotal;
  const shipping = backendTotals?.shipping ?? 0;
  const total = backendTotals?.total ?? (subTotal + shipping);

  const value: CartContextType = {
    cart,
    state,
    isLoading,
    error,
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
    clearError,
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
