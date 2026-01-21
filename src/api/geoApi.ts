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

// Get current position using browser Geolocation API
export const getCurrentPosition = (): Promise<GeolocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position.coords);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied by user'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timeout'));
            break;
          default:
            reject(new Error('An unknown error occurred while retrieving location'));
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

// Storage utilities
export const saveLocationToStorage = (location: LocationData): void => {
  try {
    localStorage.setItem('userLocation', JSON.stringify(location));
  } catch (error) {
    console.error('Failed to save location to storage:', error);
  }
};

export const getLocationFromStorage = (): LocationData | null => {
  try {
    const stored = localStorage.getItem('userLocation');
    if (!stored) return null;
    
    const location = JSON.parse(stored);
    const now = Date.now();
    
    // Consider location stale if older than 10 minutes
    if (now - location.timestamp > 600000) {
      localStorage.removeItem('userLocation');
      return null;
    }
    
    return location;
  } catch (error) {
    console.error('Failed to retrieve location from storage:', error);
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

// Deliverability cache utilities
interface DeliverabilityCache {
  [key: string]: {
    data: DeliverabilityResponse;
    timestamp: number;
  };
}

const getCacheKey = (productId: number, lat: number, lon: number): string => {
  return `${productId}-${lat.toFixed(4)}-${lon.toFixed(4)}`;
};

export const saveCachedDeliverability = (
  productId: number,
  latitude: number,
  longitude: number,
  data: DeliverabilityResponse
): void => {
  try {
    const cache: DeliverabilityCache = JSON.parse(
      localStorage.getItem('deliverabilityCache') || '{}'
    );
    
    const key = getCacheKey(productId, latitude, longitude);
    cache[key] = {
      data,
      timestamp: Date.now(),
    };
    
    localStorage.setItem('deliverabilityCache', JSON.stringify(cache));
  } catch (error) {
    console.error('Failed to cache deliverability:', error);
  }
};

export const getCachedDeliverability = (
  productId: number,
  latitude: number,
  longitude: number,
  maxAge: number = 600000 // 10 minutes
): DeliverabilityResponse | null => {
  try {
    const cache: DeliverabilityCache = JSON.parse(
      localStorage.getItem('deliverabilityCache') || '{}'
    );
    
    const key = getCacheKey(productId, latitude, longitude);
    const cached = cache[key];
    
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > maxAge) {
      delete cache[key];
      localStorage.setItem('deliverabilityCache', JSON.stringify(cache));
      return null;
    }
    
    return cached.data;
  } catch (error) {
    console.error('Failed to retrieve cached deliverability:', error);
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
