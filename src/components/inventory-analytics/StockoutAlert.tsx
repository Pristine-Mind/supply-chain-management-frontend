import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import {
  getRiskLevelBgClass,
  formatDaysUntilStockout,
  getRiskLevelColor,
} from '../../api/inventoryAnalyticsApi';
import type { RiskLevel } from '../../types/inventoryAnalytics';

export interface StockoutAlertProps {
  productId: number;
  productName: string;
  currentStock: number;
  willStockout: boolean;
  stockoutDate: string | null;
  daysUntilStockout: number | null;
  riskLevel: RiskLevel;
  dailyDemandForecast: number;
  recommendedReorderDate: string | null;
  stockoutProbability30Days?: number;
  stockoutProbability60Days?: number;
  compact?: boolean;
  showActions?: boolean;
}

const StockoutAlert: React.FC<StockoutAlertProps> = ({
  productId,
  productName,
  currentStock,
  willStockout,
  stockoutDate,
  daysUntilStockout,
  riskLevel,
  dailyDemandForecast,
  recommendedReorderDate,
  stockoutProbability30Days,
  stockoutProbability60Days,
  compact = false,
  showActions = true,
}) => {
  // Determine alert variant based on risk level
  const getAlertVariant = () => {
    switch (riskLevel) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'default';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Get risk icon
  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  // Get action message based on risk level
  const getActionMessage = () => {
    switch (riskLevel) {
      case 'critical':
        return 'URGENT: Reorder immediately. Stockout predicted within lead time.';
      case 'high':
        return 'Plan to reorder soon. Stockout predicted within 7 days after lead time.';
      case 'medium':
        return 'Monitor stock levels closely. Stockout predicted within 14 days after lead time.';
      case 'low':
        return 'Stock levels are healthy. Continue monitoring.';
      default:
        return '';
    }
  };

  // Compact view
  if (compact) {
    return (
      <div className={`p-4 rounded-lg border-l-4 ${getRiskLevelBgClass(riskLevel)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getRiskIcon()}</span>
            <div>
              <h4 className="font-semibold text-gray-900">{productName}</h4>
              <p className="text-sm text-gray-600">
                Stock: <strong>{currentStock}</strong> • 
                Risk: <span className="capitalize font-medium">{riskLevel}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${
              daysUntilStockout !== null && daysUntilStockout <= 3 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {formatDaysUntilStockout(daysUntilStockout)}
            </p>
            <p className="text-xs text-gray-500">until stockout</p>
          </div>
        </div>
        {willStockout && showActions && (
          <div className="mt-3 flex justify-end">
            <Link
              to={`/inventory-analytics/products/${productId}`}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View Details →
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <Alert variant={getAlertVariant() as any} className="mb-4">
      <div className="flex items-start gap-4">
        <span className="text-3xl flex-shrink-0">{getRiskIcon()}</span>
        <div className="flex-1">
          <AlertTitle className="text-lg font-bold mb-2">
            {riskLevel === 'low' ? 'Stock Status: Healthy' : `Stockout Risk: ${riskLevel.toUpperCase()}`}
          </AlertTitle>
          
          <AlertDescription className="space-y-3">
            {/* Product Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-semibold text-gray-900">{productName}</span>
              <span className="text-gray-500">|</span>
              <span>Current Stock: <strong className={currentStock <= 10 ? 'text-red-600' : 'text-gray-900'}>{currentStock}</strong></span>
              <span className="text-gray-500">|</span>
              <span>Daily Demand: <strong>{dailyDemandForecast.toFixed(1)}</strong> units</span>
            </div>

            {/* Stockout Prediction */}
            {willStockout && (
              <div className="bg-white/50 rounded-lg p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Expected Stockout</p>
                    <p className="text-lg font-bold text-red-600">
                      {stockoutDate || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Days Until Stockout</p>
                    <p className={`text-lg font-bold ${
                      daysUntilStockout !== null && daysUntilStockout <= 3 ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {formatDaysUntilStockout(daysUntilStockout)}
                    </p>
                  </div>
                  {recommendedReorderDate && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Reorder By</p>
                      <p className="text-lg font-bold text-indigo-600">
                        {recommendedReorderDate}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Probability Indicators */}
            {(stockoutProbability30Days !== undefined || stockoutProbability60Days !== undefined) && (
              <div className="grid grid-cols-2 gap-4">
                {stockoutProbability30Days !== undefined && (
                  <div className="bg-white/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase mb-1">30-Day Stockout Probability</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            stockoutProbability30Days >= 70 ? 'bg-red-500' :
                            stockoutProbability30Days >= 40 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${stockoutProbability30Days}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-12 text-right">
                        {stockoutProbability30Days.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
                {stockoutProbability60Days !== undefined && (
                  <div className="bg-white/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase mb-1">60-Day Stockout Probability</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            stockoutProbability60Days >= 70 ? 'bg-red-500' :
                            stockoutProbability60Days >= 40 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${stockoutProbability60Days}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-12 text-right">
                        {stockoutProbability60Days.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Message */}
            <div className={`p-3 rounded-lg ${
              riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
              riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
              riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              <p className="font-medium">{getActionMessage()}</p>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to={`/inventory-analytics/products/${productId}`}>
                  <Button size="sm" variant="default">
                    View Analytics
                  </Button>
                </Link>
                {(riskLevel === 'critical' || riskLevel === 'high') && (
                  <Link to="/inventory-analytics/reorder-recommendations">
                    <Button size="sm" variant="destructive">
                      Reorder Now
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default StockoutAlert;
