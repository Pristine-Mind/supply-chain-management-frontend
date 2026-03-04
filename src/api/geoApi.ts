import axios from 'axios';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

// Types
export interface CreateLocationRequest {
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  session_id?: string;
}

export interface LocationResponse {
  id: number;
  user: number;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  session_id?: string;
  created_at: string;
}

export interface DeliverabilityRequest {
  product_id: number;
  latitude: number;
  longitude: number;
}

export interface DeliverabilityResponse {
  is_deliverable: boolean;
  reason: string | null;
  estimated_days: number;
  shipping_cost: string;
  zone: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  timestamp: number;
}

// Create user location with authentication
export const createUserLocation = async (
  data: CreateLocationRequest
): Promise<LocationResponse> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  try {
    const response = await axios.post<LocationResponse>(
      `${API_URL}/api/v1/geo/locations/`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    }
    if (error.response?.status === 400) {
      const errors = error.response?.data;
      const errorMessage = Object.values(errors).join(', ');
      throw new Error(`Invalid location data: ${errorMessage}`);
    }
    throw error;
  }
};

// Check product deliverability (no auth required)
export const checkProductDeliverability = async (
  data: DeliverabilityRequest
): Promise<DeliverabilityResponse> => {
  try {
    const response = await axios.post<DeliverabilityResponse>(
      `${API_URL}/api/v1/geo/deliverability/check/`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('Invalid coordinates provided');
    }
    if (error.response?.status === 404) {
      throw new Error('Product not found');
    }
    throw error;
  }
};

// Product types for nearby search
export interface NearbyProductImage {
  image: string;
  alt_text?: string | null;
}

export interface NearbyProductDetails {
  id: number;
  name: string;
  description: string;
  images?: NearbyProductImage[];
  category_details: string;
  stock: number;
  price: number;
}

export interface NearbyProductItem {
  id: number;
  product: number;
  product_details: NearbyProductDetails;
  listed_price: number;
  discounted_price?: number | null;
  percent_off: number;
  is_available: boolean;
  latitude: number;
  longitude: number;
  distance_km?: number | null;
  average_rating?: number;
  total_reviews?: number;
}

// Get nearby products based on user location
export interface NearbyProductsRequest {
  latitude: number;
  longitude: number;
  radius_km?: number;
  limit?: number;
  offset?: number;
  retry?: number;
}

export interface NearbyProductsResponse {
  results: NearbyProductItem[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Custom error classes for better error handling
export class GeolocationError extends Error {
  constructor(
    message: string,
    public readonly code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'GeolocationError';
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validate coordinate bounds
export const isValidCoordinates = (latitude: number, longitude: number): boolean => {
  // Latitude must be between -90 and 90
  if (latitude < -90 || latitude > 90) return false;
  // Longitude must be between -180 and 180
  if (longitude < -180 || longitude > 180) return false;
  // Both must be valid numbers
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return true;
};

// Validate radius
export const isValidRadius = (radius: number): boolean => {
  return radius > 0 && radius <= 1000 && Number.isFinite(radius);
};

// With retry logic and timeout handling
export const getNearbyProducts = async (
  request: NearbyProductsRequest,
  timeout: number = 15000,
  maxRetries: number = 2
): Promise<NearbyProductsResponse> => {
  const retryCount = request.retry || 0;

  try {
    // Validate coordinates
    if (!isValidCoordinates(request.latitude, request.longitude)) {
      throw new Error('Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180');
    }

    // Validate radius
    const radius = request.radius_km || 50;
    if (!isValidRadius(radius)) {
      throw new Error('Invalid radius: must be between 0 and 1000 km');
    }

    const token = localStorage.getItem('token');
    
    const params: Record<string, any> = {
      latitude: request.latitude,
      longitude: request.longitude,
      radius_km: radius,
      limit: Math.min(Math.max(request.limit || 20, 1), 100), // Clamp between 1-100
      offset: Math.max(request.offset || 0, 0),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        reject(new Error('Request timeout: Location service took too long to respond'));
      }, timeout)
    );

    const response = await Promise.race([
      axios.get<NearbyProductsResponse>(
        `${API_URL}/api/v1/market/location/products/nearby/`,
        {
          params,
          headers,
          timeout: timeout,
        }
      ),
      timeoutPromise,
    ]);

    // Validate response structure
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response structure from server');
    }

    // Ensure results array exists and is an array
    if (!Array.isArray(response.data.results)) {
      return {
        results: [],
        count: 0,
        next: null,
        previous: null,
      };
    }

    // Filter out invalid products
    const validResults = response.data.results.filter((product: any) => {
      return (
        product &&
        typeof product === 'object' &&
        'id' in product &&
        'product_details' in product &&
        product.product_details &&
        'name' in product.product_details
      );
    });

    return {
      results: validResults,
      count: response.data.count || validResults.length,
      next: response.data.next || null,
      previous: response.data.previous || null,
    };
  } catch (error: any) {
    // Handle specific error cases with custom error types
    if (error instanceof ValidationError) {
      throw error;
    }

    if (error.response?.status === 401) {
      // Token expired or invalid - clear it and don't retry
      localStorage.removeItem('token');
      throw new APIError('Authentication expired. Please login again.', 401);
    }

    if (error.response?.status === 400) {
      throw new APIError(
        'Invalid location data: ' + error.response.data?.detail || 'Invalid coordinates or radius',
        400,
        error.response.data
      );
    }

    if (error.response?.status === 404) {
      throw new APIError('No products found near your location', 404);
    }

    if (error.response?.status === 429) {
      // Rate limited - retry with backoff
      if (retryCount < maxRetries) {
        const delayMs = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return getNearbyProducts(
          { ...request, retry: retryCount + 1 },
          timeout,
          maxRetries
        );
      }
      throw new APIError('Too many requests. Please try again later.', 429);
    }

    if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
      // Network timeout - retry once
      if (retryCount < maxRetries) {
        const delayMs = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return getNearbyProducts(
          { ...request, retry: retryCount + 1 },
          timeout,
          maxRetries
        );
      }
      throw new APIError('Connection timeout. Please check your internet and try again.', 0);
    }

    if (error.message?.includes('Network')) {
      // Network error - retry
      if (retryCount < maxRetries) {
        const delayMs = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return getNearbyProducts(
          { ...request, retry: retryCount + 1 },
          timeout,
          maxRetries
        );
      }
      throw new APIError('Network error. Please check your connection and try again.', 0);
    }

    console.error('Error fetching nearby products:', error);
    throw error;
  }
};

// Get current position using browser Geolocation API with better error handling
export const getCurrentPosition = (timeout: number = 10000): Promise<GeolocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new GeolocationError('Geolocation is not supported by your browser', 'UNKNOWN'));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout,
      maximumAge: 0,
    };

    let finished = false;
    const timeoutId = setTimeout(() => {
      if (!finished) {
        finished = true;
        reject(new GeolocationError('Location request timeout - device took too long to respond', 'TIMEOUT'));
      }
    }, timeout + 1000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        finished = true;
        clearTimeout(timeoutId);
        if (!isValidCoordinates(position.coords.latitude, position.coords.longitude)) {
          reject(new ValidationError('Received invalid coordinates from geolocation API', 'coordinates'));
          return;
        }
        resolve(position.coords);
      },
      (error) => {
        finished = true;
        clearTimeout(timeoutId);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new GeolocationError('Location permission denied by user', 'PERMISSION_DENIED'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new GeolocationError('Location information is unavailable on this device', 'POSITION_UNAVAILABLE'));
            break;
          case error.TIMEOUT:
            reject(new GeolocationError('Location request timeout within geolocation API', 'TIMEOUT'));
            break;
          default:
            reject(new GeolocationError('An unknown error occurred while retrieving location', 'UNKNOWN'));
        }
      },
      options
    );
  });
};

// Watch position for continuous location tracking
export const watchPosition = (
  onSuccess: (coords: LocationData) => void,
  onError: (error: Error) => void,
  interval: number = 45000 // Default 45 seconds
): (() => void) => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported by your browser'));
    return () => {};
  }

  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
  };

  let watchId: number;
  let lastUpdate = 0;

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const now = Date.now();
      // Only call onSuccess if enough time has passed since last update
      if (now - lastUpdate >= interval) {
        onSuccess({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy_meters: position.coords.accuracy,
          timestamp: now,
        });
        lastUpdate = now;
      }
    },
    (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          onError(new Error('Location permission denied'));
          break;
        case error.POSITION_UNAVAILABLE:
          onError(new Error('Location unavailable'));
          break;
        case error.TIMEOUT:
          onError(new Error('Location request timeout'));
          break;
        default:
          onError(new Error('Error tracking location'));
      }
    },
    options
  );

  // Return cleanup function
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};

// Storage utilities with edge case handling
export const saveLocationToStorage = (location: LocationData): void => {
  try {
    // Validate location before saving
    if (!location || !isValidCoordinates(location.latitude, location.longitude)) {
      console.warn('Invalid location data, not saving to storage');
      return;
    }
    
    localStorage.setItem('userLocation', JSON.stringify(location));
  } catch (error) {
    // Handle quota exceeded or other storage errors
    if (error instanceof DOMException && error.code === 22) {
      console.warn('LocalStorage quota exceeded');
      // Try to clear old entries
      try {
        localStorage.removeItem('deliverabilityCache');
      } catch (e) {
        console.warn('Failed to clear cache');
      }
    } else {
      console.error('Failed to save location to storage:', error);
    }
  }
};

export const getLocationFromStorage = (): LocationData | null => {
  try {
    const stored = localStorage.getItem('userLocation');
    if (!stored) return null;
    
    const location = JSON.parse(stored);
    
    // Validate stored location structure
    if (!location?.latitude || !location?.longitude || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      localStorage.removeItem('userLocation');
      return null;
    }

    // Validate coordinates
    if (!isValidCoordinates(location.latitude, location.longitude)) {
      localStorage.removeItem('userLocation');
      return null;
    }

    const now = Date.now();
    
    // Consider location stale if older than 10 minutes (600000ms)
    if (now - (location.timestamp || 0) > 600000) {
      localStorage.removeItem('userLocation');
      return null;
    }
    
    return location;
  } catch (error) {
    console.error('Failed to retrieve location from storage:', error);
    // Clean up corrupted data
    try {
      localStorage.removeItem('userLocation');
    } catch (e) {
      console.warn('Failed to clear corrupted location data');
    }
    return null;
  }
};

export const clearLocationFromStorage = (): void => {
  try {
    localStorage.removeItem('userLocation');
  } catch (error) {
    console.error('Failed to clear location from storage:', error);
  }
};

// Deliverability cache utilities with edge case handling
interface DeliverabilityCache {
  [key: string]: {
    data: DeliverabilityResponse;
    timestamp: number;
  };
}

const getCacheKey = (productId: number, lat: number, lon: number): string => {
  // Validate inputs
  if (!Number.isFinite(productId) || productId < 0) return '';
  if (!isValidCoordinates(lat, lon)) return '';
  
  return `${productId}-${lat.toFixed(4)}-${lon.toFixed(4)}`;
};

export const saveCachedDeliverability = (
  productId: number,
  latitude: number,
  longitude: number,
  data: DeliverabilityResponse
): void => {
  try {
    // Validate inputs
    if (!Number.isFinite(productId) || productId < 0) {
      console.warn('Invalid product ID for cache');
      return;
    }

    if (!isValidCoordinates(latitude, longitude)) {
      console.warn('Invalid coordinates for cache');
      return;
    }

    if (!data || typeof data !== 'object') {
      console.warn('Invalid deliverability data for cache');
      return;
    }

    const cacheKey = getCacheKey(productId, latitude, longitude);
    if (!cacheKey) return;

    const cacheStr = localStorage.getItem('deliverabilityCache');
    const cache: DeliverabilityCache = cacheStr ? JSON.parse(cacheStr) : {};
    
    cache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };
    
    // Prevent cache from growing too large (keep only last 1000 entries)
    const cacheKeys = Object.keys(cache);
    if (cacheKeys.length > 1000) {
      // Remove oldest entries
      const entriesToDelete = cacheKeys.sort((a, b) => {
        return cache[a].timestamp - cache[b].timestamp;
      }).slice(0, cacheKeys.length - 1000);

      entriesToDelete.forEach(key => delete cache[key]);
    }

    localStorage.setItem('deliverabilityCache', JSON.stringify(cache));
  } catch (error) {
    // Handle quota exceeded
    if (error instanceof DOMException && error.code === 22) {
      console.warn('Cache quota exceeded, clearing old cache');
      try {
        localStorage.removeItem('deliverabilityCache');
      } catch (e) {
        console.warn('Failed to clear cache');
      }
    } else {
      console.error('Failed to cache deliverability:', error);
    }
  }
};

export const getCachedDeliverability = (
  productId: number,
  latitude: number,
  longitude: number,
  maxAge: number = 600000 // 10 minutes
): DeliverabilityResponse | null => {
  try {
    // Validate inputs
    if (!Number.isFinite(productId) || productId < 0) return null;
    if (!isValidCoordinates(latitude, longitude)) return null;
    if (!Number.isFinite(maxAge) || maxAge < 0) return null;

    const cacheKey = getCacheKey(productId, latitude, longitude);
    if (!cacheKey) return null;

    const cacheStr = localStorage.getItem('deliverabilityCache');
    if (!cacheStr) return null;

    const cache: DeliverabilityCache = JSON.parse(cacheStr);
    const cached = cache[cacheKey];
    
    if (!cached) return null;

    // Validate cached entry structure
    if (!cached.data || typeof cached.timestamp !== 'number') {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > maxAge) {
      // Remove expired entry
      delete cache[cacheKey];
      localStorage.setItem('deliverabilityCache', JSON.stringify(cache));
      return null;
    }
    
    return cached.data;
  } catch (error) {
    console.error('Failed to retrieve cached deliverability:', error);
    // Try to clear corrupted cache
    try {
      localStorage.removeItem('deliverabilityCache');
    } catch (e) {
      console.warn('Failed to clear corrupted cache');
    }
    return null;
  }
};

export const clearDeliverabilityCache = (): void => {
  try {
    localStorage.removeItem('deliverabilityCache');
  } catch (error) {
    console.error('Failed to clear deliverability cache:', error);
  }
};
