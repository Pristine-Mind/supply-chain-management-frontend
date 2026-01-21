import { useState, useCallback, useEffect } from 'react';
import {
  checkProductDeliverability,
  getCachedDeliverability,
  saveCachedDeliverability,
  DeliverabilityResponse,
} from '../api/geoApi';
import { useLocation } from '../context/LocationContext';

interface UseDeliverabilityOptions {
  productId?: number;
  cacheEnabled?: boolean;
  maxCacheAge?: number; // in milliseconds
}

interface UseDeliverabilityReturn {
  deliverability: DeliverabilityResponse | null;
  loading: boolean;
  error: string | null;
  checkDeliverability: (productId: number) => Promise<DeliverabilityResponse | null>;
}

export const useDeliverability = (
  options: UseDeliverabilityOptions = {}
): UseDeliverabilityReturn => {
  const {
    productId,
    cacheEnabled = true,
    maxCacheAge = 600000,
  } = options;

  const { location } = useLocation();
  const [deliverability, setDeliverability] = useState<DeliverabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDeliverability = useCallback(
    async (id: number): Promise<DeliverabilityResponse | null> => {
      // Validate location
      if (!location) {
        setError('Location not available. Please enable location services.');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Check cache first if enabled
        if (cacheEnabled) {
          const cached = getCachedDeliverability(id, location.latitude, location.longitude, maxCacheAge);
          if (cached) {
            setDeliverability(cached);
            setLoading(false);
            return cached;
          }
        }

        // Call API
        const result = await checkProductDeliverability({
          product_id: id,
          latitude: location.latitude,
          longitude: location.longitude,
        });

        // Cache result if enabled
        if (cacheEnabled) {
          saveCachedDeliverability(id, location.latitude, location.longitude, result);
        }

        setDeliverability(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to check deliverability';
        setError(errorMessage);
        console.error('Deliverability check error:', errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [location, cacheEnabled, maxCacheAge]
  );

  // Auto-check if productId provided and location available
  useEffect(() => {
    if (productId && location && !deliverability && !error) {
      checkDeliverability(productId);
    }
  }, [productId, location, deliverability, error, checkDeliverability]);

  return {
    deliverability,
    loading,
    error,
    checkDeliverability,
  };
};

export default useDeliverability;
