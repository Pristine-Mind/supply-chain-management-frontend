import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type {
  DemandForecastResponse,
  StockoutPredictionResponse,
  InventoryOptimizationResponse,
  FullProductAnalyticsResponse,
  PortfolioAnalyticsResponse,
  ReorderRecommendationsResponse,
  BatchForecastResponse,
  ForecastQueryParams,
  ReorderRecommendationsQueryParams,
  BatchForecastRequest,
  ApplyOptimizationRequest,
  ApplyOptimizationResponse,
} from '../types/inventoryAnalytics';
import {
  getDemandForecast,
  getStockoutPrediction,
  getInventoryOptimization,
  getFullProductAnalytics,
  getPortfolioAnalytics,
  getReorderRecommendations,
  getBatchForecast,
  applyOptimization,
} from '../api/inventoryAnalyticsApi';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface InventoryAnalyticsContextType {
  // Data states
  demandForecast: DemandForecastResponse | null;
  stockoutPrediction: StockoutPredictionResponse | null;
  inventoryOptimization: InventoryOptimizationResponse | null;
  fullAnalytics: FullProductAnalyticsResponse | null;
  portfolioAnalytics: PortfolioAnalyticsResponse | null;
  reorderRecommendations: ReorderRecommendationsResponse | null;
  batchForecast: BatchForecastResponse | null;
  
  // Loading states
  loading: {
    demandForecast: boolean;
    stockoutPrediction: boolean;
    inventoryOptimization: boolean;
    fullAnalytics: boolean;
    portfolioAnalytics: boolean;
    reorderRecommendations: boolean;
    batchForecast: boolean;
    applyOptimization: boolean;
  };
  
  // Error states
  errors: {
    demandForecast: string | null;
    stockoutPrediction: string | null;
    inventoryOptimization: string | null;
    fullAnalytics: string | null;
    portfolioAnalytics: string | null;
    reorderRecommendations: string | null;
    batchForecast: string | null;
    applyOptimization: string | null;
  };
  
  // Actions
  fetchDemandForecast: (productId: number, params?: ForecastQueryParams) => Promise<void>;
  fetchStockoutPrediction: (productId: number) => Promise<void>;
  fetchInventoryOptimization: (productId: number) => Promise<void>;
  fetchFullProductAnalytics: (productId: number) => Promise<void>;
  fetchPortfolioAnalytics: () => Promise<void>;
  fetchReorderRecommendations: (params?: ReorderRecommendationsQueryParams) => Promise<void>;
  fetchBatchForecast: (data: BatchForecastRequest) => Promise<void>;
  applyOptimizationSettings: (productId: number, settings: ApplyOptimizationRequest) => Promise<ApplyOptimizationResponse | null>;
  
  // Refresh functions
  refreshPortfolioAnalytics: () => Promise<void>;
  refreshReorderRecommendations: () => Promise<void>;
  
  // Auto-refresh configuration
  autoRefreshInterval: number;
  setAutoRefreshInterval: (interval: number) => void;
  isAutoRefreshEnabled: boolean;
  setIsAutoRefreshEnabled: (enabled: boolean) => void;
  
  // Clear functions
  clearErrors: () => void;
  clearData: () => void;
}

// ============================================================================
// CREATE CONTEXT
// ============================================================================

const InventoryAnalyticsContext = createContext<InventoryAnalyticsContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface InventoryAnalyticsProviderProps {
  children: React.ReactNode;
  defaultAutoRefreshInterval?: number;
}

export const InventoryAnalyticsProvider: React.FC<InventoryAnalyticsProviderProps> = ({
  children,
  defaultAutoRefreshInterval = 5 * 60 * 1000, // 5 minutes
}) => {
  // Data states
  const [demandForecast, setDemandForecast] = useState<DemandForecastResponse | null>(null);
  const [stockoutPrediction, setStockoutPrediction] = useState<StockoutPredictionResponse | null>(null);
  const [inventoryOptimization, setInventoryOptimization] = useState<InventoryOptimizationResponse | null>(null);
  const [fullAnalytics, setFullAnalytics] = useState<FullProductAnalyticsResponse | null>(null);
  const [portfolioAnalytics, setPortfolioAnalytics] = useState<PortfolioAnalyticsResponse | null>(null);
  const [reorderRecommendations, setReorderRecommendations] = useState<ReorderRecommendationsResponse | null>(null);
  const [batchForecast, setBatchForecast] = useState<BatchForecastResponse | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState({
    demandForecast: false,
    stockoutPrediction: false,
    inventoryOptimization: false,
    fullAnalytics: false,
    portfolioAnalytics: false,
    reorderRecommendations: false,
    batchForecast: false,
    applyOptimization: false,
  });
  
  // Error states
  const [errors, setErrors] = useState({
    demandForecast: null as string | null,
    stockoutPrediction: null as string | null,
    inventoryOptimization: null as string | null,
    fullAnalytics: null as string | null,
    portfolioAnalytics: null as string | null,
    reorderRecommendations: null as string | null,
    batchForecast: null as string | null,
    applyOptimization: null as string | null,
  });
  
  // Auto-refresh configuration
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(defaultAutoRefreshInterval);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  
  // Refs for auto-refresh intervals
  const portfolioRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const reorderRefreshRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper to set loading state
  const setLoadingState = (key: keyof typeof loading, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };
  
  // Helper to set error state
  const setErrorState = (key: keyof typeof errors, value: string | null) => {
    setErrors(prev => ({ ...prev, [key]: value }));
  };
  
  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================
  
  const fetchDemandForecast = useCallback(async (productId: number, params?: ForecastQueryParams) => {
    try {
      setLoadingState('demandForecast', true);
      setErrorState('demandForecast', null);
      const data = await getDemandForecast(productId, params);
      setDemandForecast(data);
    } catch (err: any) {
      setErrorState('demandForecast', err.response?.data?.error || 'Failed to load demand forecast');
    } finally {
      setLoadingState('demandForecast', false);
    }
  }, []);
  
  const fetchStockoutPrediction = useCallback(async (productId: number) => {
    try {
      setLoadingState('stockoutPrediction', true);
      setErrorState('stockoutPrediction', null);
      const data = await getStockoutPrediction(productId);
      setStockoutPrediction(data);
    } catch (err: any) {
      setErrorState('stockoutPrediction', err.response?.data?.error || 'Failed to load stockout prediction');
    } finally {
      setLoadingState('stockoutPrediction', false);
    }
  }, []);
  
  const fetchInventoryOptimization = useCallback(async (productId: number) => {
    try {
      setLoadingState('inventoryOptimization', true);
      setErrorState('inventoryOptimization', null);
      const data = await getInventoryOptimization(productId);
      setInventoryOptimization(data);
    } catch (err: any) {
      setErrorState('inventoryOptimization', err.response?.data?.error || 'Failed to load optimization data');
    } finally {
      setLoadingState('inventoryOptimization', false);
    }
  }, []);
  
  const fetchFullProductAnalytics = useCallback(async (productId: number) => {
    try {
      setLoadingState('fullAnalytics', true);
      setErrorState('fullAnalytics', null);
      console.log('[Analytics] Fetching for product:', productId);
      const data = await getFullProductAnalytics(productId);
      console.log('[Analytics] Data received:', data);
      setFullAnalytics(data);
    } catch (err: any) {
      console.error('[Analytics] Error:', err.response?.status, err.response?.data || err.message);
      setErrorState('fullAnalytics', err.response?.data?.error || `Failed to load analytics: ${err.response?.status || err.message}`);
    } finally {
      setLoadingState('fullAnalytics', false);
    }
  }, []);
  
  const fetchPortfolioAnalytics = useCallback(async () => {
    try {
      setLoadingState('portfolioAnalytics', true);
      setErrorState('portfolioAnalytics', null);
      const data = await getPortfolioAnalytics();
      setPortfolioAnalytics(data);
    } catch (err: any) {
      setErrorState('portfolioAnalytics', err.response?.data?.error || 'Failed to load portfolio analytics');
    } finally {
      setLoadingState('portfolioAnalytics', false);
    }
  }, []);
  
  const fetchReorderRecommendations = useCallback(async (params?: ReorderRecommendationsQueryParams) => {
    try {
      setLoadingState('reorderRecommendations', true);
      setErrorState('reorderRecommendations', null);
      const data = await getReorderRecommendations(params);
      setReorderRecommendations(data);
    } catch (err: any) {
      setErrorState('reorderRecommendations', err.response?.data?.error || 'Failed to load recommendations');
    } finally {
      setLoadingState('reorderRecommendations', false);
    }
  }, []);
  
  const fetchBatchForecast = useCallback(async (data: BatchForecastRequest) => {
    try {
      setLoadingState('batchForecast', true);
      setErrorState('batchForecast', null);
      const result = await getBatchForecast(data);
      setBatchForecast(result);
    } catch (err: any) {
      setErrorState('batchForecast', err.response?.data?.error || 'Failed to load batch forecast');
    } finally {
      setLoadingState('batchForecast', false);
    }
  }, []);
  
  const applyOptimizationSettings = useCallback(async (
    productId: number,
    settings: ApplyOptimizationRequest
  ): Promise<ApplyOptimizationResponse | null> => {
    try {
      setLoadingState('applyOptimization', true);
      setErrorState('applyOptimization', null);
      const result = await applyOptimization(productId, settings);
      // Refresh optimization data after applying
      await fetchInventoryOptimization(productId);
      return result;
    } catch (err: any) {
      setErrorState('applyOptimization', err.response?.data?.error || 'Failed to apply optimization');
      return null;
    } finally {
      setLoadingState('applyOptimization', false);
    }
  }, [fetchInventoryOptimization]);
  
  // ============================================================================
  // REFRESH FUNCTIONS
  // ============================================================================
  
  const refreshPortfolioAnalytics = useCallback(async () => {
    await fetchPortfolioAnalytics();
  }, [fetchPortfolioAnalytics]);
  
  const refreshReorderRecommendations = useCallback(async () => {
    await fetchReorderRecommendations();
  }, [fetchReorderRecommendations]);
  
  // ============================================================================
  // AUTO-REFRESH LOGIC
  // ============================================================================
  
  useEffect(() => {
    // Clear existing intervals
    if (portfolioRefreshRef.current) {
      clearInterval(portfolioRefreshRef.current);
    }
    if (reorderRefreshRef.current) {
      clearInterval(reorderRefreshRef.current);
    }
    
    // Set up new intervals if enabled
    if (isAutoRefreshEnabled) {
      portfolioRefreshRef.current = setInterval(fetchPortfolioAnalytics, autoRefreshInterval);
      reorderRefreshRef.current = setInterval(() => fetchReorderRecommendations(), autoRefreshInterval);
    }
    
    // Cleanup
    return () => {
      if (portfolioRefreshRef.current) {
        clearInterval(portfolioRefreshRef.current);
      }
      if (reorderRefreshRef.current) {
        clearInterval(reorderRefreshRef.current);
      }
    };
  }, [isAutoRefreshEnabled, autoRefreshInterval, fetchPortfolioAnalytics, fetchReorderRecommendations]);
  
  // ============================================================================
  // CLEAR FUNCTIONS
  // ============================================================================
  
  const clearErrors = useCallback(() => {
    setErrors({
      demandForecast: null,
      stockoutPrediction: null,
      inventoryOptimization: null,
      fullAnalytics: null,
      portfolioAnalytics: null,
      reorderRecommendations: null,
      batchForecast: null,
      applyOptimization: null,
    });
  }, []);
  
  const clearData = useCallback(() => {
    setDemandForecast(null);
    setStockoutPrediction(null);
    setInventoryOptimization(null);
    setFullAnalytics(null);
    setPortfolioAnalytics(null);
    setReorderRecommendations(null);
    setBatchForecast(null);
    clearErrors();
  }, [clearErrors]);
  
  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  
  const value: InventoryAnalyticsContextType = {
    // Data states
    demandForecast,
    stockoutPrediction,
    inventoryOptimization,
    fullAnalytics,
    portfolioAnalytics,
    reorderRecommendations,
    batchForecast,
    
    // Loading states
    loading,
    
    // Error states
    errors,
    
    // Actions
    fetchDemandForecast,
    fetchStockoutPrediction,
    fetchInventoryOptimization,
    fetchFullProductAnalytics,
    fetchPortfolioAnalytics,
    fetchReorderRecommendations,
    fetchBatchForecast,
    applyOptimizationSettings,
    
    // Refresh functions
    refreshPortfolioAnalytics,
    refreshReorderRecommendations,
    
    // Auto-refresh configuration
    autoRefreshInterval,
    setAutoRefreshInterval,
    isAutoRefreshEnabled,
    setIsAutoRefreshEnabled,
    
    // Clear functions
    clearErrors,
    clearData,
  };
  
  return (
    <InventoryAnalyticsContext.Provider value={value}>
      {children}
    </InventoryAnalyticsContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useInventoryAnalytics = () => {
  const context = useContext(InventoryAnalyticsContext);
  if (context === undefined) {
    throw new Error('useInventoryAnalytics must be used within an InventoryAnalyticsProvider');
  }
  return context;
};

export default InventoryAnalyticsContext;
