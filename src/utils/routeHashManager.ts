import CryptoJS from 'crypto-js';

interface RouteHashEntry {
  path: string;
  hash: string;
  timestamp: number;
  params?: Record<string, string>;
}

const STORAGE_KEY = 'route_hashes_v1';
const HASH_LENGTH = 12;

export const generateRouteHash = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const combined = `${timestamp}-${random}`;
  
  try {
    const hashObj = CryptoJS.SHA256(combined);
    const hashString = hashObj.toString();
    
    const result = hashString.substring(0, HASH_LENGTH).toUpperCase();
    return result;
  } catch (error) {
    const fallbackHash = Math.random().toString(36).substring(2, HASH_LENGTH + 2).toUpperCase();
    return fallbackHash;
  }
};


export const getRouteHashes = (): RouteHashEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};


export const saveRouteHashes = (hashes: RouteHashEntry[]): void => {
  try {
    const limited = hashes.slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch (error) {
  }
};


export const getOrCreateRouteHash = (
  path: string,
  params?: Record<string, string>
): string => {
  try {
    const hashes = getRouteHashes();
    
    const routeKey = params ? `${path}?${JSON.stringify(params)}` : path;
    
    const existing = hashes.find(
      (entry) =>
        entry.path === path &&
        JSON.stringify(entry.params || {}) === JSON.stringify(params || {})
    );
    
    if (existing) {
      return existing.hash;
    }
    
    // Generate new hash
    const newHash = generateRouteHash();
    
    const newEntry: RouteHashEntry = {
      path,
      hash: newHash,
      timestamp: Date.now(),
      params,
    };
    
    // Save the new entry
    hashes.push(newEntry);
    saveRouteHashes(hashes);
    
    return newHash;
  } catch (error) {
    console.error('[RouteHash] Error in getOrCreateRouteHash:', error);
    // Fallback: generate a simple hash
    const fallback = Math.random().toString(36).substring(2, 14).toUpperCase();
    return fallback;
  }
};

/**
 * Gets hash for a route without creating one
 */
export const getRouteHash = (path: string, params?: Record<string, string>): string | null => {
  const hashes = getRouteHashes();
  
  const existing = hashes.find(
    (entry) =>
      entry.path === path &&
      JSON.stringify(entry.params || {}) === JSON.stringify(params || {})
  );
  
  return existing ? existing.hash : null;
};

/**
 * Clears all stored route hashes
 */
export const clearRouteHashes = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing route hashes:', error);
  }
};

/**
 * Gets all stored route hashes
 */
export const getAllRouteHashes = (): RouteHashEntry[] => {
  return getRouteHashes();
};

/**
 * Removes old route hashes (older than specified time in milliseconds)
 */
export const cleanOldRouteHashes = (ageInMs: number = 24 * 60 * 60 * 1000): void => {
  const hashes = getRouteHashes();
  const now = Date.now();
  
  const filtered = hashes.filter((entry) => now - entry.timestamp < ageInMs);
  
  if (filtered.length !== hashes.length) {
    saveRouteHashes(filtered);
  }
};

/**
 * Checks if a route navigation would create a duplicate history entry
 */
export const shouldAvoidDuplicateNavigation = (
  previousPath: string,
  currentPath: string,
  previousParams?: Record<string, string>,
  currentParams?: Record<string, string>
): boolean => {
  // Same path with same params = duplicate
  if (previousPath === currentPath) {
    const prevParamsStr = JSON.stringify(previousParams || {});
    const currParamsStr = JSON.stringify(currentParams || {});
    return prevParamsStr === currParamsStr;
  }
  
  return false;
};

/**
 * Gets route hash with automatic generation if needed
 */
export const getRouteHashWithFallback = (path: string, params?: Record<string, string>): string => {
  return getOrCreateRouteHash(path, params);
};

/**
 * Updates the browser URL to include the route hash
 * e.g., /marketplace/3253 becomes /marketplace/3253ABC123XYZ
 */
export const updateURLWithHash = (path: string, hash: string): void => {
  try {
    if (!path || !hash) {
      console.warn('[RouteHash] Invalid path or hash for URL update:', { path, hash });
      return;
    }

    // Check if hash already in URL
    const currentURL = window.location.pathname;
    const lastHashLength = 12;
    const existingHash = currentURL.substring(currentURL.length - lastHashLength);
    
    // Only update if the current URL doesn't already have this hash
    if (currentURL.endsWith(hash)) {
      return;
    }

    // Remove any existing hash from the path first
    let cleanPath = path;
    if (cleanPath.length > lastHashLength && /^[A-Z0-9]{12}$/.test(cleanPath.substring(cleanPath.length - lastHashLength))) {
      cleanPath = cleanPath.substring(0, cleanPath.length - lastHashLength);
    }

    const newURL = `${cleanPath}${hash}`;
    
    // Use replaceState to update URL without triggering navigation
    if (window.history && window.history.replaceState) {
      window.history.replaceState(
        { path: cleanPath, hash, timestamp: Date.now() },
        '',
        newURL
      );
    }
  } catch (error) {
    console.error('[RouteHash] Error updating URL with hash:', error);
  }
};

/**
 * Extracts the hash from the current URL pathname
 * e.g., from /marketplace/3253ABC123XYZ extracts ABC123XYZ
 */
export const extractHashFromPath = (pathname: string, expectedLength: number = HASH_LENGTH): string | null => {
  if (pathname.length > expectedLength) {
    const hash = pathname.substring(pathname.length - expectedLength);
    // Check if it looks like a hash (alphanumeric)
    if (/^[A-Z0-9]{12}$/.test(hash)) {
      return hash;
    }
  }
  return null;
};

/**
 * Stores current route state in session storage for recovery
 */
export const storeCurrentRouteState = (
  path: string,
  hash: string,
  params?: Record<string, string>
): void => {
  try {
    const state = {
      path,
      hash,
      params,
      timestamp: Date.now(),
    };
    sessionStorage.setItem('current_route_state', JSON.stringify(state));
  } catch (error) {
    console.error('Error storing route state:', error);
  }
};

/**
 * Retrieves stored route state
 */
export const getStoredRouteState = (): {
  path: string;
  hash: string;
  params?: Record<string, string>;
  timestamp: number;
} | null => {
  try {
    const stored = sessionStorage.getItem('current_route_state');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error retrieving route state:', error);
    return null;
  }
};
