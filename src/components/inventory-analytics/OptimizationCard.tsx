import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import {
  getActionBgClass,
  getUrgencyColorClass,
} from '../../api/inventoryAnalyticsApi';
import type { ActionRequired } from '../../types/inventoryAnalytics';

export interface OptimizationCardProps {
  productId: number;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  economicOrderQuantity: number;
  safetyStock: number;
  actionRequired: ActionRequired;
  urgency: 'high' | 'medium' | 'low';
  estimatedDaysUntilReorder: number;
  totalInventoryCostOptimized: number;
  recommendations: string[];
  eoqAnalysis?: {
    annual_demand: number;
    ordering_cost: number;
    holding_cost_per_unit: number;
    order_frequency_per_year: number;
    days_between_orders: number;
    total_annual_ordering_cost: number;
    total_annual_holding_cost: number;
    unit_cost: number;
  };
  reorderPointAnalysis?: {
    lead_time_demand: number;
    lead_time_days: number;
    avg_daily_demand: number;
    demand_std_dev: number;
    service_level: number;
    z_score: number;
  };
  onApplyOptimization?: () => Promise<void>;
  loading?: boolean;
}

const OptimizationCard: React.FC<OptimizationCardProps> = ({
  productId,
  productName,
  currentStock,
  reorderPoint,
  economicOrderQuantity,
  safetyStock,
  actionRequired,
  urgency,
  estimatedDaysUntilReorder,
  totalInventoryCostOptimized,
  recommendations,
  eoqAnalysis,
  reorderPointAnalysis,
  onApplyOptimization,
  loading = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    if (!onApplyOptimization) return;
    setApplying(true);
    try {
      await onApplyOptimization();
      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    } catch (error) {
      console.error('Failed to apply optimization:', error);
    } finally {
      setApplying(false);
    }
  };

  // Get action color and icon
  const getActionIndicator = () => {
    switch (actionRequired) {
      case 'reorder_now':
        return { color: 'text-accent-error-600', bgColor: 'bg-accent-error-50', icon: '🚨' };
      case 'plan_reorder':
        return { color: 'text-accent-warning-600', bgColor: 'bg-accent-warning-50', icon: '⚠️' };
      case 'monitor':
        return { color: 'text-accent-success-600', bgColor: 'bg-accent-success-50', icon: '✅' };
      default:
        return { color: 'text-neutral-600', bgColor: 'bg-neutral-50', icon: 'ℹ️' };
    }
  };

  const actionIndicator = getActionIndicator();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Inventory Optimization</CardTitle>
            <CardDescription>{productName}</CardDescription>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getActionBgClass(actionRequired)}`}>
            {actionIndicator.icon} {actionRequired.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${actionIndicator.bgColor}`}>
            <p className="text-xs text-neutral-500 uppercase">Current Stock</p>
            <p className={`text-2xl font-bold ${currentStock < reorderPoint ? 'text-accent-error-600' : 'text-neutral-900'}`}>
              {currentStock}
            </p>
            <p className="text-xs text-neutral-500">units</p>
          </div>
          <div className="bg-secondary-50 rounded-lg p-4">
            <p className="text-xs text-neutral-500 uppercase">Reorder Point</p>
            <p className="text-2xl font-bold text-secondary-600">{reorderPoint}</p>
            <p className="text-xs text-neutral-500">units</p>
          </div>
          <div className="bg-accent-success-50 rounded-lg p-4">
            <p className="text-xs text-neutral-500 uppercase">Order Quantity</p>
            <p className="text-2xl font-bold text-accent-success-600">{economicOrderQuantity}</p>
            <p className="text-xs text-neutral-500">units (EOQ)</p>
          </div>
          <div className="bg-secondary-50 rounded-lg p-4">
            <p className="text-xs text-neutral-500 uppercase">Safety Stock</p>
            <p className="text-2xl font-bold text-secondary-600">{safetyStock}</p>
            <p className="text-xs text-neutral-500">units</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`p-4 rounded-lg border-l-4 ${actionIndicator.bgColor} border-current ${actionIndicator.color}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {actionRequired === 'reorder_now' ? 'Stock below reorder point - Action required' :
                 actionRequired === 'plan_reorder' ? 'Stock approaching reorder point - Plan ahead' :
                 'Stock levels healthy - Continue monitoring'}
              </p>
              <p className={`text-sm ${getUrgencyColorClass(urgency)} mt-1`}>
                Urgency: {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
              </p>
            </div>
            {estimatedDaysUntilReorder !== undefined && (
              <div className="text-right">
                <p className="text-xs text-neutral-500">Est. Days Until Reorder</p>
                <p className={`text-xl font-bold ${estimatedDaysUntilReorder < 0 ? 'text-accent-error-600' : 'text-neutral-900'}`}>
                  {estimatedDaysUntilReorder < 0 ? 'Overdue' : estimatedDaysUntilReorder.toFixed(1)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-700 mb-3">Recommendations</h4>
            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <Alert key={idx} variant="default" className="py-3">
                  <AlertDescription className="flex items-start gap-2">
                    <span>💡</span>
                    <span>{rec}</span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Analysis Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full"
        >
          {showDetails ? 'Hide Details' : 'Show Detailed Analysis'}
        </Button>

        {/* Detailed Analysis */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            {/* EOQ Analysis */}
            {eoqAnalysis && (
              <div className="bg-neutral-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-neutral-700 mb-3">Economic Order Quantity (EOQ) Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500">Annual Demand</p>
                    <p className="font-semibold">{eoqAnalysis.annual_demand.toFixed(0)} units</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Unit Cost</p>
                    <p className="font-semibold">${eoqAnalysis.unit_cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Ordering Cost</p>
                    <p className="font-semibold">${eoqAnalysis.ordering_cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Holding Cost/Unit</p>
                    <p className="font-semibold">${eoqAnalysis.holding_cost_per_unit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Order Frequency</p>
                    <p className="font-semibold">{eoqAnalysis.order_frequency_per_year.toFixed(1)}/year</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Days Between Orders</p>
                    <p className="font-semibold">{eoqAnalysis.days_between_orders.toFixed(1)} days</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500">Annual Ordering Cost</p>
                    <p className="text-lg font-semibold text-neutral-900">
                      ${eoqAnalysis.total_annual_ordering_cost.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Annual Holding Cost</p>
                    <p className="text-lg font-semibold text-neutral-900">
                      ${eoqAnalysis.total_annual_holding_cost.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reorder Point Analysis */}
            {reorderPointAnalysis && (
              <div className="bg-neutral-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-neutral-700 mb-3">Reorder Point Analysis</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500">Lead Time</p>
                    <p className="font-semibold">{reorderPointAnalysis.lead_time_days} days</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Lead Time Demand</p>
                    <p className="font-semibold">{reorderPointAnalysis.lead_time_demand.toFixed(1)} units</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Avg Daily Demand</p>
                    <p className="font-semibold">{reorderPointAnalysis.avg_daily_demand.toFixed(1)} units</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Demand Std Dev</p>
                    <p className="font-semibold">{reorderPointAnalysis.demand_std_dev.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Service Level</p>
                    <p className="font-semibold">{(reorderPointAnalysis.service_level * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Z-Score</p>
                    <p className="font-semibold">{reorderPointAnalysis.z_score.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Total Cost Summary */}
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-neutral-600">Total Optimized Inventory Cost</p>
                  <p className="text-xs text-neutral-500">Annual projection with recommended settings</p>
                </div>
                <p className="text-2xl font-bold text-secondary-600">
                  ${totalInventoryCostOptimized.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {applied && (
          <Alert variant="success" className="mt-4">
            <AlertTitle>✅ Success</AlertTitle>
            <AlertDescription>
              Optimization settings have been applied successfully!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
        {onApplyOptimization && (
          <Button
            onClick={handleApply}
            disabled={applying || loading}
            variant={actionRequired === 'reorder_now' ? 'destructive' : 'default'}
          >
            {applying ? 'Applying...' : actionRequired === 'reorder_now' ? 'Apply & Reorder' : 'Apply Settings'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default OptimizationCard;
