import axios from 'axios';
import type {
  DemandForecastResponse,
  ForecastQueryParams,
  StockoutPredictionResponse,
  InventoryOptimizationResponse,
  ApplyOptimizationRequest,
  ApplyOptimizationResponse,
  FullProductAnalyticsResponse,
  PortfolioAnalyticsResponse,
  ReorderRecommendationsResponse,
  ReorderRecommendationsQueryParams,
  BatchForecastRequest,
  BatchForecastResponse,
  RiskLevel,
  ActionRequired,
  ForecastMethod,
} from '../types/inventoryAnalytics';

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

export const getDemandForecast = async (
  productId: number,
  params: ForecastQueryParams = {}
): Promise<DemandForecastResponse> => {
  const response = await axios.get(
    `${API_BASE}/api/v1/producer/products/${productId}/forecast/`,
    {
      headers: getAuthHeader(),
      params: buildQueryParams({
        days: params.days || 30,
        method: params.method || 'ensemble',
      }),
    }
  );
  return response.data;
};

export const getStockoutPrediction = async (
  productId: number
): Promise<StockoutPredictionResponse> => {
  const response = await axios.get(
    `${API_BASE}/api/v1/producer/products/${productId}/stockout-prediction/`,
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};


export const getInventoryOptimization = async (
  productId: number
): Promise<InventoryOptimizationResponse> => {
  const response = await axios.get(
    `${API_BASE}/api/v1/producer/products/${productId}/optimization/`,
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};


export const applyOptimization = async (
  productId: number,
  settings: ApplyOptimizationRequest
): Promise<ApplyOptimizationResponse> => {
  const response = await axios.post(
    `${API_BASE}/api/v1/producer/products/${productId}/optimization/`,
    settings,
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};


export const getFullProductAnalytics = async (
  productId: number
): Promise<FullProductAnalyticsResponse> => {
  const response = await axios.get(
    `${API_BASE}/api/v1/producer/products/${productId}/analytics/`,
    {
      headers: getAuthHeader(),
    }
  );
  return response.data;
};


export const getPortfolioAnalytics = async (): Promise<PortfolioAnalyticsResponse> => {
  const response = await axios.get(`${API_BASE}/api/v1/producer/portfolio-analytics/`, {
    headers: getAuthHeader(),
  });
  return response.data;
};


export const getReorderRecommendations = async (
  params: ReorderRecommendationsQueryParams = {}
): Promise<ReorderRecommendationsResponse> => {
  const response = await axios.get(`${API_BASE}/api/v1/producer/reorder-recommendations/`, {
    headers: getAuthHeader(),
    params: buildQueryParams(params),
  });
  return response.data;
};


export const getBatchForecast = async (
  data: BatchForecastRequest
): Promise<BatchForecastResponse> => {
  const response = await axios.post(`${API_BASE}/api/v1/producer/batch-forecast/`, data, {
    headers: getAuthHeader(),
  });
  return response.data;
};


export const getRiskLevelColor = (level: RiskLevel | string): string => {
  switch (level) {
    case 'critical':
      return 'red';
    case 'high':
      return 'orange';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'green';
    default:
      return 'gray';
  }
};


export const getRiskLevelBgClass = (level: RiskLevel | string): string => {
  switch (level) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};


export const getActionColor = (action: ActionRequired | string): string => {
  switch (action) {
    case 'reorder_now':
      return 'red';
    case 'plan_reorder':
      return 'yellow';
    case 'monitor':
      return 'green';
    default:
      return 'gray';
  }
};


export const getActionBgClass = (action: ActionRequired | string): string => {
  switch (action) {
    case 'reorder_now':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'plan_reorder':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'monitor':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};


export const getTrendColor = (trend: string): string => {
  switch (trend) {
    case 'increasing':
    case 'up':
      return 'green';
    case 'decreasing':
    case 'down':
      return 'red';
    case 'stable':
      return 'gray';
    default:
      return 'gray';
  }
};


export const getTrendIcon = (trend: string): string => {
  switch (trend) {
    case 'increasing':
    case 'up':
      return '↑';
    case 'decreasing':
    case 'down':
      return '↓';
    case 'stable':
      return '→';
    default:
      return '→';
  }
};


export const getForecastMethodDisplay = (method: ForecastMethod | string): string => {
  switch (method) {
    case 'moving_average':
      return 'Moving Average';
    case 'exponential_smoothing':
      return 'Exponential Smoothing';
    case 'seasonal':
      return 'Seasonal Decomposition';
    case 'ensemble':
      return 'Ensemble (Recommended)';
    default:
      return method;
  }
};


export const getForecastMethodDescription = (method: ForecastMethod | string): string => {
  switch (method) {
    case 'moving_average':
      return 'Simple average of recent sales (good for stable demand)';
    case 'exponential_smoothing':
      return 'Weights recent data more heavily (good for trends)';
    case 'seasonal':
      return 'Detects weekly patterns (good for products with day-of-week variations)';
    case 'ensemble':
      return 'Combines all methods for best accuracy (recommended)';
    default:
      return '';
  }
};


export const formatDaysUntilStockout = (days: number | null): string => {
  if (days === null || days === undefined) return 'N/A';
  if (days < 0) return 'Already stocked out';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
};


export const getUrgencyColorClass = (urgency: string): string => {
  switch (urgency) {
    case 'high':
      return 'text-red-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};


export const getConfidenceColor = (confidence: string): string => {
  switch (confidence) {
    case 'high':
      return 'green';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'red';
    default:
      return 'gray';
  }
};
