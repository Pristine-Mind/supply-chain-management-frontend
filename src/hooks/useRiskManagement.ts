import { useState, useEffect } from 'react';
import {
  listAlerts,
  getAlertStatistics,
  listSupplierScorecards,
  listKPIs,
  listRiskCategories,
} from '../api/riskManagementApi';
import type {
  SupplyChainAlert,
  AlertStatistics,
  SupplierScorecard,
  SupplyChainKPI,
  RiskCategory,
  AlertQueryParams,
  ScorecardQueryParams,
  KPIQueryParams,
  RiskCategoryQueryParams,
} from '../types/riskManagement';

/**
 * Hook for fetching and managing alerts with pagination
 */
export const useAlerts = (params: AlertQueryParams = {}, enabled = true) => {
  const [alerts, setAlerts] = useState<SupplyChainAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAlerts = async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      const response = await listAlerts(params);
      setAlerts(response.results);
      setTotalCount(response.count);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [JSON.stringify(params), enabled]);

  return { alerts, loading, error, totalCount, refetch: fetchAlerts };
};

/**
 * Hook for fetching alert statistics
 */
export const useAlertStatistics = (enabled = true) => {
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      const data = await getAlertStatistics();
      setStatistics(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [enabled]);

  return { statistics, loading, error, refetch: fetchStatistics };
};

/**
 * Hook for fetching supplier scorecards with pagination
 */
export const useScorecards = (params: ScorecardQueryParams = {}, enabled = true) => {
  const [scorecards, setScorecards] = useState<SupplierScorecard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchScorecards = async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      const response = await listSupplierScorecards(params);
      setScorecards(response.results);
      setTotalCount(response.count);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load scorecards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecards();
  }, [JSON.stringify(params), enabled]);

  return { scorecards, loading, error, totalCount, refetch: fetchScorecards };
};

/**
 * Hook for fetching KPIs with pagination
 */
export const useKPIs = (params: KPIQueryParams = {}, enabled = true) => {
  const [kpis, setKPIs] = useState<SupplyChainKPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchKPIs = async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      const response = await listKPIs(params);
      setKPIs(response.results);
      setTotalCount(response.count);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load KPIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, [JSON.stringify(params), enabled]);

  return { kpis, loading, error, totalCount, refetch: fetchKPIs };
};

/**
 * Hook for fetching risk categories with pagination
 */
export const useRiskCategories = (params: RiskCategoryQueryParams = {}, enabled = true) => {
  const [riskCategories, setRiskCategories] = useState<RiskCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRiskCategories = async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      const response = await listRiskCategories(params);
      setRiskCategories(response.results);
      setTotalCount(response.count);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load risk categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskCategories();
  }, [JSON.stringify(params), enabled]);

  return { riskCategories, loading, error, totalCount, refetch: fetchRiskCategories };
};

/**
 * Hook for real-time alert monitoring
 * Polls for active alerts at a specified interval
 */
export const useAlertMonitor = (
  interval: number = 60000, // 1 minute default
  enabled = true
) => {
  const { alerts, loading, error, refetch } = useAlerts(
    { status: 'active', severity: 'critical' },
    enabled
  );
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    setCriticalCount(alerts.length);
  }, [alerts]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      refetch();
    }, interval);

    return () => clearInterval(timer);
  }, [interval, enabled, refetch]);

  return { criticalAlerts: alerts, criticalCount, loading, error };
};

/**
 * Hook for debounced search
 */
export const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
