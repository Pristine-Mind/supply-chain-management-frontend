import axios from 'axios';
import type {
  SupplierScorecard,
  ScorecardHistory,
  ScorecardComparison,
  SupplyChainKPI,
  SupplyChainAlert,
  AlertStatistics,
  AlertThreshold,
  UpdateThresholdRequest,
  RiskCategory,
  RiskDrillDown,
  RiskDashboardSummary,
  PaginatedResponse,
  ScorecardQueryParams,
  KPIQueryParams,
  AlertQueryParams,
  RiskCategoryQueryParams,
  ComparisonQueryParams,
} from '../types/riskManagement';

const API_BASE = import.meta.env.VITE_REACT_APP_API_URL;

const getAuthHeader = () => ({
  Authorization: `Token ${localStorage.getItem('token')}`,
});

// Helper function to build query params
const buildQueryParams = (params: Record<string, any>) => {
  const filtered: Record<string, string> = {};
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      filtered[key] = String(params[key]);
    }
  });
  return filtered;
};

// ============================================================================
// SUPPLIER SCORECARD API
// ============================================================================

/**
 * Get list of supplier scorecards with optional filters
 */
export const listSupplierScorecards = async (
  params: ScorecardQueryParams = {}
): Promise<PaginatedResponse<SupplierScorecard>> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/supplier-scorecards/`, {
    headers: getAuthHeader(),
    params: buildQueryParams(params),
  });
  return response.data;
};

/**
 * Get specific supplier scorecard by ID
 */
export const getSupplierScorecard = async (supplierId: number): Promise<SupplierScorecard> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/supplier-scorecards/?supplier_id=${supplierId}`, {
    headers: getAuthHeader(),
  });
  // If the API returns a paginated response, get the first item
  if (response.data.results) {
    return response.data.results[0];
  }
  return response.data;
};

/**
 * Get current user's supplier scorecard
 */
export const getCurrentUserScorecard = async (): Promise<SupplierScorecard> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/supplier-scorecards/current/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Get 90-day history for a scorecard
 */
export const getScorecardHistory = async (supplierId: number): Promise<ScorecardHistory[]> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/supplier-scorecards/?supplier_id=${supplierId}`, {
    headers: getAuthHeader(),
  });
  // If the API returns paginated results with history data
  if (response.data.results && response.data.results[0]) {
    const scorecard = response.data.results[0];
    // Return history data if available, otherwise empty array
    return scorecard.history || [];
  }
  return [];
};

/**
 * Compare multiple supplier scorecards
 */
export const compareScorecards = async (
  params: ComparisonQueryParams = {}
): Promise<ScorecardComparison[]> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/supplier-scorecards/comparison/`, {
    headers: getAuthHeader(),
    params: buildQueryParams(params),
  });
  return response.data;
};

// ============================================================================
// SUPPLY CHAIN KPI API
// ============================================================================

/**
 * Get list of KPI snapshots with optional filters
 */
export const listKPIs = async (
  params: KPIQueryParams = {}
): Promise<PaginatedResponse<SupplyChainKPI>> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/kpis/`, {
    headers: getAuthHeader(),
    params: buildQueryParams(params),
  });
  return response.data;
};

/**
 * Get specific KPI snapshot by ID
 */
export const getKPI = async (id: number): Promise<SupplyChainKPI> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/kpis/${id}/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Get latest KPI snapshot for current user
 */
export const getCurrentKPI = async (): Promise<SupplyChainKPI> => {
  const response = await axios.get(`${API_BASE}api/v1/risk/kpis/current/`, {
    headers: getAuthHeader(),
  });
  console.log('Current KPI response:', response);
  return response.data;
};

/**
 * Get 30-day KPI trends
 */
export const getKPITrends = async (): Promise<SupplyChainKPI[]> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/kpis/trends/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// SUPPLY CHAIN ALERTS API
// ============================================================================

/**
 * Get list of alerts with optional filters
 */
export const listAlerts = async (
  params: AlertQueryParams = {}
): Promise<PaginatedResponse<SupplyChainAlert>> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/alerts/`, {
    headers: getAuthHeader(),
    params: buildQueryParams(params),
  });
  return response.data;
};

/**
 * Get specific alert by ID
 */
export const getAlert = async (id: number): Promise<SupplyChainAlert> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/alerts/${id}/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = async (alertId: string | number): Promise<SupplyChainAlert> => {
  const response = await axios.post(
    `${API_BASE}/api/v1/risk/alerts/${alertId}/acknowledge/`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
};

/**
 * Resolve an alert
 */
export const resolveAlert = async (alertId: string | number): Promise<SupplyChainAlert> => {
  const response = await axios.post(
    `${API_BASE}/api/v1/risk/alerts/${alertId}/resolve/`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
};

/**
 * Get active alerts (status: active or acknowledged)
 */
export const getActiveAlerts = async (
  params: Omit<AlertQueryParams, 'status'> = {}
): Promise<PaginatedResponse<SupplyChainAlert>> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/alerts/active/`, {
    headers: getAuthHeader(),
    params: buildQueryParams(params),
  });
  return response.data;
};

/**
 * Get alert statistics
 */
export const getAlertStatistics = async (): Promise<AlertStatistics> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/alerts/statistics/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// ALERT THRESHOLDS API
// ============================================================================

/**
 * Get list of alert thresholds (Admin only)
 */
export const listAlertThresholds = async (
  alertType?: string
): Promise<PaginatedResponse<AlertThreshold>> => {
  const params = alertType ? { alert_type: alertType } : {};
  const response = await axios.get(`${API_BASE}/api/v1/risk/alert-thresholds/`, {
    headers: getAuthHeader(),
    params,
  });
  return response.data;
};

/**
 * Get specific alert threshold by ID (Admin only)
 */
export const getAlertThreshold = async (id: number): Promise<AlertThreshold> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/alert-thresholds/${id}/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Update alert threshold (Admin only)
 */
export const updateAlertThreshold = async (
  id: number,
  data: UpdateThresholdRequest
): Promise<AlertThreshold> => {
  const response = await axios.put(`${API_BASE}/api/v1/risk/alert-thresholds/${id}/`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Partial update alert threshold (Admin only)
 */
export const patchAlertThreshold = async (
  id: number,
  data: Partial<UpdateThresholdRequest>
): Promise<AlertThreshold> => {
  const response = await axios.patch(`${API_BASE}/api/v1/risk/alert-thresholds/${id}/`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// RISK CATEGORIES API
// ============================================================================

/**
 * Get list of risk categories with optional filters
 */
export const listRiskCategories = async (
  params: RiskCategoryQueryParams = {}
): Promise<PaginatedResponse<RiskCategory>> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/risk-categories/`, {
    headers: getAuthHeader(),
    params: buildQueryParams(params),
  });
  return response.data;
};

/**
 * Get specific risk category by ID
 */
export const getRiskCategory = async (id: number): Promise<RiskCategory> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/risk-categories/${id}/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Get current risk assessment for today
 */
export const getCurrentRiskAssessment = async (): Promise<RiskCategory> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/risk-categories/current/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Get risk drill-downs (detailed breakdown)
 */
export const getRiskDrillDowns = async (
  supplierId?: number
): Promise<PaginatedResponse<RiskDrillDown>> => {
  const url = supplierId 
    ? `${API_BASE}/api/v1/risk/drill-downs/?supplier_id=${supplierId}`
    : `${API_BASE}/api/v1/risk/drill-downs/current/`;
  const response = await axios.get(url, {
    headers: getAuthHeader(),
  });
  return response.data;
};

/**
 * Get comprehensive risk dashboard summary
 */
export const getRiskDashboardSummary = async (): Promise<RiskDashboardSummary> => {
  const response = await axios.get(`${API_BASE}/api/v1/risk/risk-categories/summary/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get health status color
 */
export const getHealthStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy':
      return 'green';
    case 'monitor':
      return 'yellow';
    case 'critical':
      return 'red';
    default:
      return 'gray';
  }
};

/**
 * Get alert severity color
 */
export const getAlertSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'red';
    case 'warning':
      return 'yellow';
    case 'info':
      return 'blue';
    default:
      return 'gray';
  }
};

/**
 * Get risk level color
 */
export const getRiskLevelColor = (level: string): string => {
  switch (level) {
    case 'low':
      return 'green';
    case 'medium':
      return 'yellow';
    case 'high':
      return 'orange';
    case 'critical':
      return 'red';
    default:
      return 'gray';
  }
};

/**
 * Format percentage with trend indicator
 */
export const formatTrendPercentage = (value: number, trend?: number): string => {
  const trendIndicator = trend
    ? trend > 0
      ? ' ↑'
      : trend < 0
      ? ' ↓'
      : ' →'
    : '';
  return `${value.toFixed(1)}%${trendIndicator}`;
};

/**
 * Get alert type icon
 */
export const getAlertTypeIcon = (alertType: string): string => {
  const icons: Record<string, string> = {
    otif_violation: '📦',
    quality_issue: '⚠️',
    delivery_delay: '🚚',
    inventory_low: '📊',
    supplier_risk: '🔔',
  };
  return icons[alertType] || '📋';
};
