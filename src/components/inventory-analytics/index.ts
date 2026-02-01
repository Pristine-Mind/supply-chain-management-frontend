// Inventory Analytics Components
export { default as InventoryAnalyticsDashboard } from './InventoryAnalyticsDashboard';
export { default as ProductAnalyticsDetail } from './ProductAnalyticsDetail';
export { default as ReorderRecommendationsList } from './ReorderRecommendationsList';
export { default as PortfolioView } from './PortfolioView';
export { default as BatchForecast } from './BatchForecast';
export { default as ProductsAnalyticsList } from './ProductsAnalyticsList';

// Re-export types for convenience
export type {
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
  RiskLevel,
  ActionRequired,
  ForecastMethod,
  TrendDirection,
} from '../../types/inventoryAnalytics';
