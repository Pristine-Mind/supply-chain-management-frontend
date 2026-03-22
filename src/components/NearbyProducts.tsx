import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getNearbyProducts, getLocationFromStorage, getCurrentPosition, saveLocationToStorage, isValidCoordinates, NearbyProductItem, GeolocationError, ValidationError } from '../api/geoApi';
import LoginModal from './auth/LoginModal';

const PLACEHOLDER = 'https://via.placeholder.com/600';

interface NearbyProductsProps {
  radiusKm?: number;
  limit?: number;
}

const NearbyProducts: React.FC<NearbyProductsProps> = ({ 
  radiusKm = 50,
  limit = 8
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  const [products, setProducts] = useState<NearbyProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<NearbyProductItem | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Refs for cleanup and preventing multiple requests
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const locationRequestInProgressRef = useRef(false);
  const lastCartOperationRef = useRef<{ productId: number; timestamp: number } | null>(null);

  // Check browser support for Geolocation API
  const isGeolocationSupported = useCallback((): boolean => {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  }, []);

  // Check browser support for localStorage
  const isLocalStorageSupported = useCallback((): boolean => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Request location with better error handling
  const requestLocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    // Prevent concurrent requests
    if (locationRequestInProgressRef.current) {
      return null;
    }

    locationRequestInProgressRef.current = true;

    try {
      if (!isGeolocationSupported()) {
        if (isMountedRef.current) {
          setError('Geolocation is not supported on this device. Please check browser settings.');
        }
        return null;
      }

      const position = await getCurrentPosition();

      // Validate coordinates before using
      if (!isValidCoordinates(position.latitude, position.longitude)) {
        if (isMountedRef.current) {
          setError('Received invalid location coordinates. Please try again.');
        }
        return null;
      }

      const location = {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy_meters: position.accuracy || undefined,
        timestamp: Date.now(),
      };

      // Try to save to localStorage if supported
      if (isLocalStorageSupported()) {
        try {
          saveLocationToStorage(location);
        } catch (storageErr) {
          console.warn('Failed to cache location:', storageErr);
          // Continue even if caching fails
        }
      }

      return {
        latitude: location.latitude,
        longitude: location.longitude,
      };
    } catch (err: any) {
      if (!isMountedRef.current) return null;

      // Handle specific error types
      if (err instanceof GeolocationError) {
        if (err.code === 'PERMISSION_DENIED') {
          setShowLocationPrompt(true);
        } else if (err.code === 'TIMEOUT') {
          setError('Location request timed out. Please try again or enable location services.');
        } else if (err.code === 'POSITION_UNAVAILABLE') {
          setError('Location services are unavailable. Please check your device settings.');
        } else {
          setError(err.message);
        }
      } else if (err instanceof ValidationError) {
        setError('Invalid location received. Please try again.');
      } else {
        setError(err.message || 'Unknown location error');
      }

      return null;
    } finally {
      locationRequestInProgressRef.current = false;
    }
  }, [isGeolocationSupported, isLocalStorageSupported]);

  // Fetch nearby products with proper cleanup
  const fetchNearbyProducts = useCallback(async () => {
    // Don't fetch if component is unmounted
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);
      setShowLocationPrompt(false);

      // Get location from storage or request new one
      let locationData = isLocalStorageSupported() ? getLocationFromStorage() : null;

      let latitude: number, longitude: number;

      if (locationData) {
        latitude = locationData.latitude;
        longitude = locationData.longitude;
      } else {
        const locResult = await requestLocation();
        if (!locResult) {
          setLoading(false);
          return;
        }
        latitude = locResult.latitude;
        longitude = locResult.longitude;
      }

      // Validate coordinates one more time
      if (!isValidCoordinates(latitude, longitude)) {
        if (isMountedRef.current) {
          setError('Invalid location. Please try enabling location again.');
          setShowLocationPrompt(true);
        }
        setLoading(false);
        return;
      }

      setUserLocation({ latitude, longitude });

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Fetch products with timeout
      const response = await getNearbyProducts(
        {
          latitude,
          longitude,
          radius_km: radiusKm,
          limit,
          offset: 0,
        },
        15000, // 15 second timeout
        2 // max 2 retries
      );

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      if (response.results && Array.isArray(response.results) && response.results.length > 0) {
        setProducts(response.results);
        setRetryCount(0); // Reset retry count on success
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;

      // Don't set error if request was aborted
      if (err.name === 'AbortError') return;

      const errorMsg = err.message || 'Failed to load nearby products';
      setError(errorMsg);
      setProducts([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [radiusKm, limit, requestLocation, isLocalStorageSupported]);

  // Initial fetch on mount
  useEffect(() => {
    isMountedRef.current = true;
    fetchNearbyProducts();

    return () => {
      isMountedRef.current = false;
      // Cancel any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear any pending timeouts
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, []);

  // Handle tab visibility changes (when user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;

      // If tab becomes visible again and location is stale, refresh products
      if (isVisible && userLocation) {
        const now = Date.now();
        const storedLocation = getLocationFromStorage();
        
        // Refetch if location is older than 10 minutes or not stored
        if (!storedLocation || now - storedLocation.timestamp > 600000) {
          fetchNearbyProducts();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userLocation]);

  const handleRequestLocation = useCallback(async () => {
    try {
      setLoading(true);
      setShowLocationPrompt(false);
      setRetryCount(prev => prev + 1);

      const location = await requestLocation();
      if (location) {
        setUserLocation(location);
        // Refetch products with new location
        await fetchNearbyProducts();
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError('Unable to access your location. Please check your browser settings.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [requestLocation, fetchNearbyProducts]);

  const handleRetry = useCallback(async () => {
    if (retryCount >= 3) {
      setError('Maximum retry attempts reached. Please try again later.');
      return;
    }
    setRetryCount(prev => prev + 1);
    await fetchNearbyProducts();
  }, [retryCount, fetchNearbyProducts]);

  const handleAddToCart = useCallback(async (product: NearbyProductItem, e: React.MouseEvent) => {
    e.stopPropagation();

    // Validate product data
    if (!product || !product.id) {
      setError('Invalid product data');
      return;
    }

    // Prevent double-click/rapid clicks on same product
    const now = Date.now();
    if (lastCartOperationRef.current?.productId === product.id && 
        (now - lastCartOperationRef.current.timestamp) < 1000) {
      return; // Ignore rapid clicks
    }
    lastCartOperationRef.current = { productId: product.id, timestamp: now };

    if (!isAuthenticated) {
      setPendingProduct(product);
      setShowLoginModal(true);
      return;
    }

    try {
      // Cast to any since cart context expects MarketplaceProduct
      await addToCart(product as any);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      
      // Handle specific errors
      if (error.message?.includes('permission') || error.message?.includes('auth')) {
        setError('Please login to add items to cart');
        setPendingProduct(product);
        setShowLoginModal(true);
      } else {
        setError('Failed to add item to cart. Please try again.');
      }
    }
  }, [isAuthenticated, addToCart]);

  const handleProductClick = useCallback((productId: number) => {
    if (!productId) {
      setError('Invalid product');
      return;
    }
    navigate(`/marketplace/${productId}`);
  }, [navigate]);

  // Memoize product list to prevent unnecessary re-renders
  const memoizedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    return products.map(product => ({
      ...product,
      // Validate and provide defaults for critical fields
      id: product.id || 0,
      product_details: {
        ...product.product_details,
        name: product.product_details?.name || 'Unknown Product',
        images: Array.isArray(product.product_details?.images) ? product.product_details?.images : [],
        category_details: product.product_details?.category_details || 'Uncategorized',
      },
      listed_price: typeof product.listed_price === 'number' ? product.listed_price : 0,
      discounted_price: product.discounted_price || null,
      percent_off: typeof product.percent_off === 'number' ? product.percent_off : 0,
      is_available: product.is_available !== false,
      is_delivery_free: product.is_delivery_free || false,
      distance_km: (typeof product.distance_km === 'number') ? product.distance_km : null,
    }));
  }, [products]);

  // Show nothing if loading, no products, or error
  if (loading) {
    return (
      <section className="py-8 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-orange-600" />
            <h2 className="text-2xl font-bold text-neutral-900">Products Near You</h2>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 text-orange-600 animate-spin mr-2" />
            <span className="text-neutral-600">Finding products near your location...</span>
          </div>
        </div>
      </section>
    );
  }

  if (showLocationPrompt) {
    return (
      <section className="py-8 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-orange-600" />
            <h2 className="text-2xl font-bold text-neutral-900">Products Near You</h2>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex flex-col items-center text-center max-w-md mx-auto">
            <MapPin className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Enable Location Access</h3>
            <p className="text-blue-800 mb-6 text-sm">
              We need your location to show you products available nearby. This helps us provide personalized recommendations.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleRequestLocation}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin inline mr-2" />
                    Finding Location...
                  </>
                ) : (
                  'Enable Location'
                )}
              </button>
              <button
                onClick={() => {
                  setShowLocationPrompt(false);
                  setLoading(false);
                }}
                className="px-6 py-3 bg-neutral-200 text-neutral-700 rounded-lg font-medium hover:bg-neutral-300 transition-colors"
              >
                Skip For Now
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    const canRetry = retryCount < 3;
    return (
      <section className="py-8 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-orange-600" />
            <h2 className="text-2xl font-bold text-neutral-900">Products Near You</h2>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4 max-w-2xl">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Unable to Load Nearby Products</h3>
              <p className="text-red-800 mb-4 text-sm">{error}</p>
              
              {/* Error-specific suggestions */}
              {error.includes('Authentication') && (
                <p className="text-red-700 text-xs mb-3 bg-red-100 p-2 rounded">
                  Try logging in again or clearing your browser cache.
                </p>
              )}
              
              {error.includes('timeout') && (
                <p className="text-red-700 text-xs mb-3 bg-red-100 p-2 rounded">
                  Check your internet connection and try again.
                </p>
              )}

              {error.includes('Network') && (
                <p className="text-red-700 text-xs mb-3 bg-red-100 p-2 rounded">
                  Check your internet connection. Try switching between WiFi and mobile data.
                </p>
              )}

              {error.includes('location') && (
                <p className="text-red-700 text-xs mb-3 bg-red-100 p-2 rounded">
                  Enable location services in your browser settings (usually in the address bar).
                </p>
              )}

              <div className="flex gap-2">
                {canRetry && (
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry ({retryCount}/3)
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-400 transition-colors text-sm"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <section className="py-8 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-orange-600" />
            <h2 className="text-2xl font-bold text-neutral-900">Products Near You</h2>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center max-w-2xl mx-auto">
            <MapPin className="w-12 h-12 text-neutral-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Products Found Nearby</h3>
            <p className="text-neutral-600 mb-6">
              There are no products available within {radiusKm}km of your location. Try expanding your search radius or browsing other categories.
            </p>
            <button
              onClick={() => navigate('/marketplace/all-products')}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Browse All Products
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 mb-6"
        >
          <MapPin className="w-5 h-5 text-orange-600" />
          <h2 className="text-2xl font-bold text-neutral-900">Products Near You</h2>
          {userLocation && (
            <span className="text-sm text-neutral-600 ml-auto">
              Within {radiusKm}km of your location
            </span>
          )}
        </motion.div>

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {memoizedProducts && memoizedProducts.length > 0 ? (
              memoizedProducts.map((product, index) => {
                // Validate product structure (double check)
                if (!product?.id || !product?.product_details) {
                  return null;
                }

                const {
                  product_details = {} as any,
                  listed_price = 0,
                  discounted_price = null,
                  percent_off = 0,
                  is_available = true,
                  distance_km = null,
                } = product;

                const {
                  name = 'Unknown Product',
                  images = [],
                  category_details = 'Uncategorized',
                } = product_details as any;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    viewport={{ once: true }}
                    onClick={() => handleProductClick(product.id)}
                    className="bg-white rounded-lg border border-neutral-200 overflow-hidden group hover:shadow-lg hover:border-neutral-300 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden bg-neutral-50">
                      {percent_off > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm z-10">
                          {Math.round(Math.min(percent_off, 100))}% OFF
                        </div>
                      )}

                      {product.is_delivery_free && (
                        <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm z-10 flex items-center gap-1">
                          <span>🚚</span> Free Delivery
                        </div>
                      )}

                      {distance_km && !isNaN(distance_km) && !product.is_delivery_free && (
                        <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium z-10 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {distance_km.toFixed(1)}km
                        </div>
                      )}

                      <img
                        src={images?.length > 0 && images[0]?.image ? images[0].image : PLACEHOLDER}
                        alt={name || 'Product'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER;
                        }}
                      />

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button className="bg-white text-neutral-900 px-6 py-2 rounded-lg font-medium hover:bg-neutral-50 transition-colors shadow-sm">
                          Quick View
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-block bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wide flex-shrink-0 line-clamp-1">
                          {category_details || 'Uncategorized'}
                        </span>
                      </div>

                      <h3 className="font-semibold text-neutral-700 leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors min-h-[2.5rem]">
                        {name}
                      </h3>

                      {/* Price */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-bold text-red-600">
                            Rs. {(discounted_price || listed_price)?.toLocaleString()}
                          </span>
                          {discounted_price && listed_price > discounted_price && (
                            <span className="text-sm text-neutral-500 line-through">
                              Rs. {listed_price?.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={!is_available}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
                          is_available
                            ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm hover:shadow-md'
                            : 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {is_available ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : null}
          </AnimatePresence>
        </motion.div>

        {memoizedProducts && memoizedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={() => navigate(`/marketplace/all-products?nearby=true&radius=${radiusKm}`)}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
            >
              View More Nearby Products
            </button>
          </motion.div>
        )}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingProduct(null);
        }}
        onSuccess={async () => {
          setShowLoginModal(false);
          if (pendingProduct) {
            try {
              await addToCart(pendingProduct as any);
            } catch (error) {
              console.error('Error adding to cart after login:', error);
              if (isMountedRef.current) {
                setError('Failed to add item to cart. Please try again.');
              }
            } finally {
              setPendingProduct(null);
            }
          }
        }}
      />
    </section>
  );
};

export default NearbyProducts;
