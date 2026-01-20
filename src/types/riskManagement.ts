// Risk Management Types

export type HealthStatus = 'healthy' | 'monitor' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'auto_resolved';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'otif_violation' | 'quality_issue' | 'delivery_delay' | 'inventory_low' | 'supplier_risk';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Supplier Scorecard
export interface SupplierScorecard {
  id: number;
  supplier_id: number;
  supplier_name: string;
  health_score: number;
  health_status: HealthStatus;
  health_status_display: string;
  on_time_delivery_pct: number;
  quality_performance_pct: number;
  lead_time_consistency_pct: number;
  payment_reliability_pct: number;
  total_orders: number;
  on_time_orders: number;
  defect_count: number;
  avg_lead_time_days: number;
  lead_time_variance: number;
  late_payments_count: number;
  is_healthy: boolean;
  is_critical: boolean;
  last_calculated: string;
  calculation_period_start: string;
  created_at: string;
  updated_at: string;
}

export interface ScorecardHistory {
  supplier_name: string;
  health_score: number;
  health_status: HealthStatus;
  health_status_display: string;
  on_time_delivery_pct: number;
  quality_performance_pct: number;
  lead_time_consistency_pct: number;
  recorded_at: string;
}

export interface ScorecardComparison {
  supplier_id: number;
  supplier_name: string;
  health_score: number;
  health_status: HealthStatus;
  on_time_delivery_pct: number;
  quality_performance_pct: number;
  lead_time_consistency_pct: number;
  payment_reliability_pct: number;
  is_healthy: boolean;
  is_critical: boolean;
}

// Supply Chain KPIs
export interface SupplyChainKPI {
  id?: number;
  supplier_name: string;
  otif_rate: number;
  otif_previous: number;
  otif_trend_pct: number;
  lead_time_variability: number;
  lead_time_avg: number;
  lead_time_trend: number;
  inventory_turnover_ratio: number;
  inventory_turnover_previous: number;
  inventory_trend_pct: number;
  stock_out_incidents: number;
  low_stock_items_count: number;
  orders_pending_count: number;
  orders_delayed_count: number;
  period_start: string;
  period_end: string;
  snapshot_date: string;
  created_at: string;
}

// Supply Chain Alerts
export interface SupplyChainAlert {
  id: number;
  alert_id: string;
  alert_type: AlertType;
  alert_type_display: string;
  severity: AlertSeverity;
  severity_display: string;
  status: AlertStatus;
  status_display: string;
  title: string;
  description: string;
  supplier_name: string | null;
  product_name: string | null;
  metric_value: number | null;
  threshold_value: number | null;
  triggered_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  assigned_to_username: string | null;
  is_notified: boolean;
  notification_channels: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AlertStatistics {
  total_alerts: number;
  active: number;
  acknowledged: number;
  resolved: number;
  by_severity: {
    critical: number;
    warning: number;
    info: number;
  };
  by_type: {
    otif_violation: number;
    quality_issue: number;
    delivery_delay: number;
    inventory_low: number;
    supplier_risk: number;
  };
  last_7_days: number;
}

// Alert Thresholds
export interface AlertThreshold {
  id?: number;
  alert_type: AlertType;
  alert_type_display: string;
  critical_threshold: number;
  critical_enabled: boolean;
  warning_threshold: number;
  warning_enabled: boolean;
  check_frequency_minutes: number;
  auto_resolve_hours: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateThresholdRequest {
  critical_threshold?: number;
  critical_enabled?: boolean;
  warning_threshold?: number;
  warning_enabled?: boolean;
  check_frequency_minutes?: number;
  auto_resolve_hours?: number;
  description?: string;
}

// Risk Categories
export interface RiskDrillDown {
  id?: number;
  risk_type: string;
  risk_type_display: string;
  item_type: string;
  item_type_display: string;
  item_id: number;
  item_name: string;
  metric_value: number;
  threshold: number;
  status: string;
  status_display: string;
  details: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RiskCategory {
  id: number;
  supplier_id: number;
  supplier_name: string;
  supplier_risk_level: RiskLevel;
  supplier_risk_level_display: string;
  supplier_high_risk_count: number;
  supplier_spend_at_risk: number;
  single_source_dependencies: number;
  logistics_risk_level: RiskLevel;
  logistics_risk_level_display: string;
  active_shipment_delays: number;
  avg_delay_days: number;
  routes_with_issues: number;
  demand_risk_level: RiskLevel;
  demand_risk_level_display: string;
  forecast_accuracy: number;
  volatile_products_count: number;
  stockout_incidents: number;
  inventory_risk_level: RiskLevel;
  inventory_risk_level_display: string;
  items_below_safety_stock: number;
  overstock_items_count: number;
  total_inventory_value_at_risk: number;
  overall_risk_score: number;
  overall_risk_level: RiskLevel;
  overall_risk_level_display: string;
  drill_downs: RiskDrillDown[];
  snapshot_date: string;
  last_updated: string;
  created_at: string;
}

// Risk Dashboard Summary
export interface RiskDashboardSummary {
  timestamp: string;
  supplier_scorecard: SupplierScorecard | null;
  kpis: SupplyChainKPI | null;
  critical_alerts: number;
  warning_alerts: number;
  info_alerts: number;
  total_alerts: number;
  risk_overview: RiskCategory | null;
}

// Paginated Response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Query Parameters
export interface ScorecardQueryParams {
  health_status?: HealthStatus;
  supplier__name?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface KPIQueryParams {
  supplier__name?: string;
  snapshot_date?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface AlertQueryParams {
  alert_type?: AlertType;
  severity?: AlertSeverity;
  status?: AlertStatus;
  supplier__name?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface RiskCategoryQueryParams {
  supplier__name?: string;
  overall_risk_level?: RiskLevel;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface ComparisonQueryParams {
  supplier_ids?: string;
}
