import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getRiskDashboardSummary,
  getActiveAlerts,
  getCurrentUserScorecard,
  getCurrentKPI,
  getCurrentRiskAssessment,
} from '../api/riskManagementApi';
import type {
  RiskDashboardSummary,
  SupplierScorecard,
  SupplyChainKPI,
  RiskCategory,
  SupplyChainAlert,
} from '../types/riskManagement';

interface RiskManagementContextType {
  dashboard: RiskDashboardSummary | null;
  scorecard: SupplierScorecard | null;
  kpis: SupplyChainKPI | null;
  riskAssessment: RiskCategory | null;
  activeAlerts: SupplyChainAlert[];
  loading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
  refreshScorecard: () => Promise<void>;
  refreshKPIs: () => Promise<void>;
  refreshRiskAssessment: () => Promise<void>;
  refreshActiveAlerts: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const RiskManagementContext = createContext<RiskManagementContextType | undefined>(undefined);

export const useRiskManagement = () => {
  const context = useContext(RiskManagementContext);
  if (!context) {
    throw new Error('useRiskManagement must be used within RiskManagementProvider');
  }
  return context;
};

interface RiskManagementProviderProps {
  children: React.ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const RiskManagementProvider: React.FC<RiskManagementProviderProps> = ({
  children,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000, // 5 minutes default
}) => {
  const [dashboard, setDashboard] = useState<RiskDashboardSummary | null>(null);
  const [scorecard, setScorecard] = useState<SupplierScorecard | null>(null);
  const [kpis, setKPIs] = useState<SupplyChainKPI | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskCategory | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<SupplyChainAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDashboard = async () => {
    try {
      const data = await getRiskDashboardSummary();
      setDashboard(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
      console.error('Error loading risk dashboard:', err);
    }
  };

  const refreshScorecard = async () => {
    try {
      const data = await getCurrentUserScorecard();
      setScorecard(data);
      setError(null);
    } catch (err: any) {
      // Don't set error if no scorecard found (supplier might not have one)
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || 'Failed to load scorecard');
      }
      console.error('Error loading scorecard:', err);
    }
  };

  const refreshKPIs = async () => {
    try {
      const data = await getCurrentKPI();
      setKPIs(data);
      setError(null);
    } catch (err: any) {
      // Don't set error if no KPI found
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || 'Failed to load KPIs');
      }
      console.error('Error loading KPIs:', err);
    }
  };

  const refreshRiskAssessment = async () => {
    try {
      const data = await getCurrentRiskAssessment();
      setRiskAssessment(data);
      setError(null);
    } catch (err: any) {
      // Don't set error if no risk assessment found
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || 'Failed to load risk assessment');
      }
      console.error('Error loading risk assessment:', err);
    }
  };

  const refreshActiveAlerts = async () => {
    try {
      const response = await getActiveAlerts();
      setActiveAlerts(response.results);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load active alerts');
      console.error('Error loading active alerts:', err);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshDashboard(),
        refreshScorecard(),
        refreshKPIs(),
        refreshRiskAssessment(),
        refreshActiveAlerts(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshAll();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAll();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const value: RiskManagementContextType = {
    dashboard,
    scorecard,
    kpis,
    riskAssessment,
    activeAlerts,
    loading,
    error,
    refreshDashboard,
    refreshScorecard,
    refreshKPIs,
    refreshRiskAssessment,
    refreshActiveAlerts,
    refreshAll,
  };

  return (
    <RiskManagementContext.Provider value={value}>
      {children}
    </RiskManagementContext.Provider>
  );
};

export default RiskManagementContext;
