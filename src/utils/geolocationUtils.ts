/**
 * Geolocation Utilities - Comprehensive edge case handling
 * Handles location permissions, validation, and error scenarios
 */

export enum LocationErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  BROWSER_UNSUPPORTED = 'BROWSER_UNSUPPORTED',
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  STALE_LOCATION = 'STALE_LOCATION',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class LocationError extends Error {
  constructor(
    public readonly type: LocationErrorType,
    message: string
  ) {
    super(message);
    this.name = 'LocationError';
  }
}

/**
 * Validates latitude and longitude coordinates
 */
export const validateCoordinates = (
  latitude: number,
  longitude: number
): { valid: boolean; error?: string } => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { valid: false, error: 'Coordinates must be valid numbers' };
  }

  if (latitude < -90 || latitude > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (longitude < -180 || longitude > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { valid: true };
};

/**
 * Validates location accuracy
 */
export const isLocationAccurate = (
  accuracyMeters?: number,
  threshold: number = 100
): boolean => {
  if (!accuracyMeters) return true;
  return accuracyMeters <= threshold;
};

/**
 * Check if location is stale
 */
export const isLocationStale = (
  timestamp: number,
  maxAgeMs: number = 600000 // 10 minutes
): boolean => {
  const now = Date.now();
  return now - timestamp > maxAgeMs;
};

/**
 * Get user-friendly error message from error type
 */
export const getErrorMessage = (errorType: LocationErrorType): string => {
  const messages: Record<LocationErrorType, string> = {
    [LocationErrorType.PERMISSION_DENIED]:
      'Location permission was denied. Please enable location access in your browser settings.',
    [LocationErrorType.POSITION_UNAVAILABLE]:
      'Your device location is currently unavailable. Please check your location settings.',
    [LocationErrorType.TIMEOUT]:
      'Location request timed out. Please try again or check your internet connection.',
    [LocationErrorType.BROWSER_UNSUPPORTED]:
      'Your browser does not support location services. Please use a modern browser.',
    [LocationErrorType.INVALID_COORDINATES]:
      'Invalid location coordinates. Please try again.',
    [LocationErrorType.STALE_LOCATION]:
      'Your location data is outdated. Please refresh to get current location.',
    [LocationErrorType.NETWORK_ERROR]:
      'Network error while checking deliverability. Please check your connection.',
    [LocationErrorType.UNKNOWN]:
      'An unexpected error occurred. Please try again.',
  };

  return messages[errorType] || messages[LocationErrorType.UNKNOWN];
};

/**
 * Handle geolocation API errors
 */
export const handleGeolocationError = (error: GeolocationPositionError): LocationError => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return new LocationError(
        LocationErrorType.PERMISSION_DENIED,
        getErrorMessage(LocationErrorType.PERMISSION_DENIED)
      );
    case error.POSITION_UNAVAILABLE:
      return new LocationError(
        LocationErrorType.POSITION_UNAVAILABLE,
        getErrorMessage(LocationErrorType.POSITION_UNAVAILABLE)
      );
    case error.TIMEOUT:
      return new LocationError(
        LocationErrorType.TIMEOUT,
        getErrorMessage(LocationErrorType.TIMEOUT)
      );
    default:
      return new LocationError(
        LocationErrorType.UNKNOWN,
        getErrorMessage(LocationErrorType.UNKNOWN)
      );
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Retry mechanism for failed location requests
 */
export const retryGetPosition = async (
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<GeolocationCoordinates> => {
  if (!navigator.geolocation) {
    throw new LocationError(
      LocationErrorType.BROWSER_UNSUPPORTED,
      getErrorMessage(LocationErrorType.BROWSER_UNSUPPORTED)
    );
  }

  let lastError: LocationError | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(
            new LocationError(
              LocationErrorType.TIMEOUT,
              `Location request timeout (attempt ${attempt}/${maxRetries})`
            )
          );
        }, 10000);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            resolve(position.coords);
          },
          (error) => {
            clearTimeout(timeoutId);
            reject(handleGeolocationError(error));
          },
          {
            enableHighAccuracy: true,
            timeout: 9000,
            maximumAge: 0,
          }
        );
      });
    } catch (error) {
      lastError = error as LocationError;

      // Don't retry on permission denied
      if (lastError.type === LocationErrorType.PERMISSION_DENIED) {
        throw lastError;
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new LocationError(
    LocationErrorType.UNKNOWN,
    getErrorMessage(LocationErrorType.UNKNOWN)
  );
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (
  latitude: number,
  longitude: number,
  precision: number = 4
): string => {
  return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
};

/**
 * Get compass direction from angle
 */
export const getCompassDirection = (angle: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(angle / 22.5) % 16;
  return directions[index];
};

/**
 * Check if two coordinates are roughly the same location
 * Useful for preventing duplicate API calls
 */
export const areSameLocation = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  toleranceMeters: number = 50
): boolean => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance * 1000 <= toleranceMeters; // Convert km to meters
};

/**
 * Rate limit helper for location tracking
 */
export class LocationRateLimiter {
  private lastUpdate: number = 0;
  private readonly minIntervalMs: number;

  constructor(minIntervalMs: number = 30000) {
    this.minIntervalMs = minIntervalMs;
  }

  shouldUpdate(): boolean {
    const now = Date.now();
    if (now - this.lastUpdate >= this.minIntervalMs) {
      this.lastUpdate = now;
      return true;
    }
    return false;
  }

  reset(): void {
    this.lastUpdate = 0;
  }

  getTimeSinceLastUpdate(): number {
    return Date.now() - this.lastUpdate;
  }
}

/**
 * Batch location updates for efficiency
 */
export class LocationBatcher {
  private locations: Array<{ latitude: number; longitude: number; timestamp: number }> = [];
  private readonly batchSize: number;

  constructor(batchSize: number = 5) {
    this.batchSize = batchSize;
  }

  add(latitude: number, longitude: number): boolean {
    this.locations.push({
      latitude,
      longitude,
      timestamp: Date.now(),
    });

    return this.isFull();
  }

  isFull(): boolean {
    return this.locations.length >= this.batchSize;
  }

  getBatch() {
    return this.locations.splice(0, this.batchSize);
  }

  clear(): void {
    this.locations = [];
  }

  getSize(): number {
    return this.locations.length;
  }
}
