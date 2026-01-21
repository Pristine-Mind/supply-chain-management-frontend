import { useState, useCallback } from 'react';
import {
  retryGetPosition,
  LocationError,
  LocationErrorType,
  getErrorMessage,
  validateCoordinates,
} from '../utils/geolocationUtils';

interface UseLocationRigorousReturn {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  errorType: LocationErrorType | null;
  requestLocation: () => Promise<boolean>;
  retry: () => Promise<boolean>;
}

/**
 * Rigorous location hook with comprehensive error handling and retry mechanism
 */
export const useLocationRigorous = (): UseLocationRigorousReturn => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<LocationErrorType | null>(null);

  const requestLocation = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setErrorType(null);

    try {
      // Attempt to get position with retries
      const coords = await retryGetPosition(3, 1000);

      // Validate coordinates
      const validation = validateCoordinates(coords.latitude, coords.longitude);
      if (!validation.valid) {
        setError(validation.error || 'Invalid coordinates');
        setErrorType(LocationErrorType.INVALID_COORDINATES);
        setLoading(false);
        return false;
      }

      // Update state with validated coordinates
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      setAccuracy(coords.accuracy);
      setError(null);
      setErrorType(null);
      setLoading(false);
      return true;
    } catch (err) {
      if (err instanceof LocationError) {
        setError(err.message);
        setErrorType(err.type);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setErrorType(LocationErrorType.UNKNOWN);
      }
      setLatitude(null);
      setLongitude(null);
      setAccuracy(null);
      setLoading(false);
      return false;
    }
  }, []);

  const retry = useCallback(async (): Promise<boolean> => {
    return requestLocation();
  }, [requestLocation]);

  return {
    latitude,
    longitude,
    accuracy,
    loading,
    error,
    errorType,
    requestLocation,
    retry,
  };
};

export default useLocationRigorous;
