import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  getCurrentPosition,
  watchPosition,
  createUserLocation,
  getLocationFromStorage,
  saveLocationToStorage,
  clearLocationFromStorage,
  LocationData,
} from '../api/geoApi';

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
  permissionRequested: boolean;
  requestPermission: () => Promise<boolean>;
  updateLocation: () => Promise<void>;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
  autoRefresh = true,
  refreshInterval = 45000, // 45 seconds
}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  // Initialize location from storage on mount
  useEffect(() => {
    const storedLocation = getLocationFromStorage();
    if (storedLocation) {
      setLocation(storedLocation);
      setHasPermission(true);
    }

    // Check if user has already granted permission
    const savedPermissionStatus = localStorage.getItem('locationPermissionRequested');
    if (savedPermissionStatus === 'true') {
      setPermissionRequested(true);
      setHasPermission(true);
    }
  }, []);

  const recordLocation = useCallback(async (coords: LocationData) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Record location with API
        await createUserLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy_meters: coords.accuracy_meters,
          session_id: `session_${Date.now()}`,
        });
      }

      // Save to local storage
      saveLocationToStorage(coords);
      setLocation(coords);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record location';
      console.error('Error recording location:', errorMessage);
      // Still save to local storage even if API fails
      saveLocationToStorage(coords);
      setLocation(coords);
    }
  }, []);

  const updateLocation = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const coords = await getCurrentPosition();
      const locationData: LocationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy_meters: coords.accuracy,
        timestamp: Date.now(),
      };

      await recordLocation(locationData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      console.error('Error updating location:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [recordLocation]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setPermissionRequested(true);
    localStorage.setItem('locationPermissionRequested', 'true');

    try {
      const coords = await getCurrentPosition();
      const locationData: LocationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy_meters: coords.accuracy,
        timestamp: Date.now(),
      };

      await recordLocation(locationData);
      setHasPermission(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Permission denied';
      setError(errorMessage);
      setHasPermission(false);
      console.error('Location permission error:', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [recordLocation]);

  const clearLocation = useCallback(() => {
    clearLocationFromStorage();
    setLocation(null);
    setHasPermission(false);
    setPermissionRequested(false);
    localStorage.removeItem('locationPermissionRequested');
  }, []);

  // Set up auto-refresh with watchPosition if permission granted
  useEffect(() => {
    if (!autoRefresh || !hasPermission) return;

    let cleanup: (() => void) | null = null;

    const startWatching = async () => {
      try {
        cleanup = watchPosition(
          (coords) => {
            recordLocation(coords);
          },
          (err) => {
            console.error('Watch position error:', err.message);
            setError(err.message);
          },
          refreshInterval
        );
      } catch (err) {
        console.error('Error starting location watch:', err);
      }
    };

    startWatching();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [autoRefresh, hasPermission, refreshInterval, recordLocation]);

  const value: LocationContextType = {
    location,
    loading,
    error,
    hasPermission,
    permissionRequested,
    requestPermission,
    updateLocation,
    clearLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;
