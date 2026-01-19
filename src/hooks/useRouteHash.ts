
import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  getOrCreateRouteHash,
  storeCurrentRouteState,
  shouldAvoidDuplicateNavigation,
  cleanOldRouteHashes,
  getStoredRouteState,
  getRouteHashWithFallback,
  updateURLWithHash,
  extractHashFromPath,
} from '../utils/routeHashManager';

interface UseRouteHashOptions {
  autoClean?: boolean;
  cleanInterval?: number;
  enableLogging?: boolean;
}

export const useRouteHash = (options: UseRouteHashOptions = {}) => {
  const {
    autoClean = true,
    cleanInterval = 24 * 60 * 60 * 1000,
    enableLogging = false,
  } = options;

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const previousRouteRef = useRef<{
    path: string;
    hash: string;
    params?: Record<string, string>;
  } | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getQueryParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  useEffect(() => {
    const queryParams = getQueryParams();
    const currentHash = getRouteHashWithFallback(location.pathname, queryParams);

    updateURLWithHash(location.pathname, currentHash);

    const isDuplicate = previousRouteRef.current
      ? shouldAvoidDuplicateNavigation(
          previousRouteRef.current.path,
          location.pathname,
          previousRouteRef.current.params,
          queryParams
        )
      : false;

    storeCurrentRouteState(location.pathname, currentHash, queryParams);

    previousRouteRef.current = {
      path: location.pathname,
      hash: currentHash,
      params: queryParams,
    };
  }, [location.pathname, location.search, getQueryParams, enableLogging]);

  useEffect(() => {
    if (autoClean) {
      cleanOldRouteHashes(cleanInterval);

      cleanupIntervalRef.current = setInterval(
        () => cleanOldRouteHashes(cleanInterval),
        cleanInterval
      );

      return () => {
        if (cleanupIntervalRef.current) {
          clearInterval(cleanupIntervalRef.current);
        }
      };
    }
  }, [autoClean, cleanInterval]);

  const getCurrentHash = useCallback(() => {
    const queryParams = getQueryParams();
    return getOrCreateRouteHash(location.pathname, queryParams);
  }, [location.pathname, getQueryParams]);

  const getPreviousRoute = useCallback(() => {
    return previousRouteRef.current;
  }, []);

  const getRouteState = useCallback(() => {
    return getStoredRouteState();
  }, []);

  return {
    currentPath: location.pathname,
    currentHash: getCurrentHash(),
    previousRoute: getPreviousRoute(),
    routeState: getRouteState(),
    isDuplicate:
      previousRouteRef.current &&
      shouldAvoidDuplicateNavigation(
        previousRouteRef.current.path,
        location.pathname,
        previousRouteRef.current.params,
        getQueryParams()
      ),
  };
};

export const useRouteNavigationLogging = () => {
  const location = useLocation();
  const previousPathRef = useRef<string>();

  useEffect(() => {
    previousPathRef.current = location.pathname;
  }, [location]);
};

export const usePreventDuplicateNavigation = () => {
  const location = useLocation();
  const previousLocationRef = useRef(location);

  useEffect(() => {
    previousLocationRef.current = location;
  }, [location]);
};

export default useRouteHash;
