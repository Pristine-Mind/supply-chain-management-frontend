// Predictive Inventory Analytics Types

export type ForecastMethod = 'moving_average' | 'exponential_smoothing' | 'seasonal' | 'ensemble';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type ActionRequired = 'reorder_now' | 'plan_reorder' | 'monitor';
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';

// ============================================================================
// DEMAND FORECAST TYPES
// ============================================================================

export interface IndividualForecast {
  daily_forecast: number;
  method: string;
  window_used?: number;
  alpha?: number;
}

export interface DemandForecast {
  daily_forecast: number;
  forecast_period_days: number;
  total_forecast: number;
  confidence_interval: [number, number];
  method: ForecastMethod;
  methods_used: string[];
  std_deviation: number;
  individual_forecasts: IndividualForecast[];
}

export interface DemandForecastResponse {
  product_id: number;
  product_name: string;
  forecast: DemandForecast;
  method_used: ForecastMethod;
  forecast_days: number;
}

export interface ForecastQueryParams {
  days?: number;
  method?: ForecastMethod;
}

// ============================================================================
// STOCKOUT PREDICTION TYPES
// ============================================================================

export interface StockoutPrediction {
  will_stockout: boolean;
  stockout_date: string | null;
  days_until_stockout: number | null;
  risk_level: RiskLevel;
  current_stock: number;
  daily_demand_forecast: number;
  lead_time_days: number;
  safety_stock: number;
  recommended_reorder_date: string | null;
}

export interface StockoutProbabilityPeriod {
  probability: number;
  probability_decimal: number;
  period_days: number;
  confidence: 'high' | 'medium' | 'low';
  simulations_run: number;
  average_daily_demand: number;
  demand_std_dev: number;
}

export interface StockoutProbability {
  '30_days': StockoutProbabilityPeriod;
  '60_days': StockoutProbabilityPeriod;
}

export interface RiskAssessment {
  level: RiskLevel;
  action_required: boolean;
  recommended_action: string;
}

export interface StockoutPredictionResponse {
  product_id: number;
  product_name: string;
  current_stock: number;
  stockout_prediction: StockoutPrediction;
  stockout_probability: StockoutProbability;
  risk_assessment: RiskAssessment;
}

// ============================================================================
// INVENTORY OPTIMIZATION TYPES
// ============================================================================

export interface CurrentSettings {
  stock: number;
  reorder_level: number;
  reorder_point: number;
  safety_stock: number;
  lead_time_days: number;
}

export interface OptimizationResult {
  product_id: number;
  product_name: string;
  current_stock: number;
  reorder_point: number;
  economic_order_quantity: number;
  safety_stock: number;
  action_required: ActionRequired;
  urgency: 'high' | 'medium' | 'low';
  estimated_days_until_reorder: number;
  total_inventory_cost_optimized: number;
  recommendations: string[];
}

export interface EOQAnalysis {
  eoq: number;
  economic_order_quantity: number;
  annual_demand: number;
  ordering_cost: number;
  holding_cost_per_unit: number;
  order_frequency_per_year: number;
  days_between_orders: number;
  total_annual_ordering_cost: number;
  total_annual_holding_cost: number;
  unit_cost: number;
}

export interface ReorderPointAnalysis {
  reorder_point: number;
  safety_stock: number;
  lead_time_demand: number;
  lead_time_days: number;
  avg_daily_demand: number;
  demand_std_dev: number;
  service_level: number;
  z_score: number;
  current_reorder_point: number;
  recommended_change: number;
}

export interface InventoryOptimizationResponse {
  product_id: number;
  product_name: string;
  current_settings: CurrentSettings;
  optimization: OptimizationResult;
  eoq_analysis: EOQAnalysis;
  reorder_point_analysis: ReorderPointAnalysis;
}

export interface ApplyOptimizationRequest {
  apply_reorder_point?: boolean;
  apply_safety_stock?: boolean;
  apply_reorder_quantity?: boolean;
}

export interface ApplyOptimizationResponse {
  success: boolean;
  message: string;
  applied_settings: {
    reorder_point?: number;
    safety_stock?: number;
    reorder_quantity?: number;
  };
}

// ============================================================================
// FULL ANALYTICS TYPES
// ============================================================================

export interface ProductInfo {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  reorder_level: number;
  reorder_point: number;
  safety_stock: number;
}

export interface SeasonalityData {
  has_seasonality: boolean;
  peak_day: string;
  low_day: string;
  peak_to_low_ratio: number;
  daily_averages: Record<string, number>;
}

export interface TrendData {
  trend: TrendDirection;
  change_percentage: number;
  first_period_avg: number;
  second_period_avg: number;
  trend_direction: 'up' | 'down' | 'stable';
}

export interface FullProductAnalyticsResponse {
  product: ProductInfo;
  demand_forecast: DemandForecast;
  stockout_prediction: StockoutPrediction;
  stockout_probability: {
    probability: number;
    confidence: string;
  };
  optimization: OptimizationResult;
  seasonality: SeasonalityData;
  trends: TrendData;
}

// ============================================================================
// PORTFOLIO ANALYTICS TYPES
// ============================================================================

export interface AtRiskProduct {
  product_id: number;
  name: string;
  stock: number;
  risk_level: RiskLevel;
  days_until_stockout: number;
}

export interface PortfolioAnalytics {
  total_products: number;
  low_stock_count: number;
  stockout_risk_count: number;
  reorder_needed_count: number;
  healthy_stock_percentage: number;
  at_risk_products: AtRiskProduct[];
}

export interface PortfolioAnalyticsResponse {
  portfolio_analytics: PortfolioAnalytics;
  generated_at: string;
}

// ============================================================================
// REORDER RECOMMENDATIONS TYPES
// ============================================================================

export interface ReorderRecommendation {
  product_id: number;
  product_name: string;
  sku: string;
  current_stock: number;
  risk_level: RiskLevel;
  days_until_stockout: number;
  stockout_date: string;
  recommended_order_quantity: number;
  urgency: 'high' | 'medium' | 'low';
  action: ActionRequired;
}

export interface ReorderRecommendationsResponse {
  recommendations: ReorderRecommendation[];
  total_recommended: number;
  critical_count: number;
  high_count: number;
}

export interface ReorderRecommendationsQueryParams {
  risk_level?: RiskLevel;
  limit?: number;
}

// ============================================================================
// BATCH FORECAST TYPES
// ============================================================================

export interface BatchForecastItem {
  product_id: number;
  product_name: string;
  forecast: {
    daily_forecast: number;
    forecast_period_days: number;
    total_forecast: number;
    method: ForecastMethod;
  };
}

export interface BatchForecastRequest {
  product_ids: number[];
  days?: number;
}

export interface BatchForecastResponse {
  forecasts: BatchForecastItem[];
  errors: string[];
  forecast_days: number;
}

// ============================================================================
// DASHBOARD SUMMARY TYPES
// ============================================================================

export interface InventoryDashboardSummary {
  timestamp: string;
  total_products: number;
  critical_stock_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  healthy_stock_count: number;
  pending_reorders: number;
  recent_forecasts: BatchForecastItem[];
  top_at_risk: AtRiskProduct[];
}
