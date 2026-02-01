import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInventoryAnalytics } from '../../context/InventoryAnalyticsContext';
import {
  getRiskLevelBgClass,
  getActionBgClass,
  formatDaysUntilStockout,
} from '../../api/inventoryAnalyticsApi';
import BackButton from '../BackButton';
import { Button } from '../ui/button';
import type { RiskLevel, ActionRequired } from '../../types/inventoryAnalytics';

const ReorderRecommendationsList: React.FC = () => {
  const {
    reorderRecommendations,
    loading,
    errors,
    fetchReorderRecommendations,
  } = useInventoryAnalytics();

  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel | 'all'>('all');
  const [limit, setLimit] = useState<number>(20);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [selectedRiskLevel, limit]);

  const loadRecommendations = async () => {
    setRefreshing(true);
    const params: { risk_level?: RiskLevel; limit?: number } = {};
    if (selectedRiskLevel !== 'all') {
      params.risk_level = selectedRiskLevel;
    }
    params.limit = limit;
    await fetchReorderRecommendations(params);
    setRefreshing(false);
  };

  const handleCreatePurchaseOrder = (productId: number, quantity: number) => {
    // This would typically open a modal or navigate to a purchase order creation page
    alert(`Create purchase order for Product ${productId} with quantity ${quantity}`);
  };

  if (loading.reorderRecommendations && !reorderRecommendations) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reorder recommendations...</p>
        </div>
      </div>
    );
  }

  if (errors.reorderRecommendations) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <BackButton />
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mt-4">
          {errors.reorderRecommendations}
        </div>
      </div>
    );
  }

  const recommendations = reorderRecommendations?.recommendations || [];
  const totalRecommended = reorderRecommendations?.total_recommended || 0;
  const criticalCount = reorderRecommendations?.critical_count || 0;
  const highCount = reorderRecommendations?.high_count || 0;

  return (
    <div className="space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 shadow-lg rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">🚨 Reorder Recommendations</h1>
            <p className="text-red-100 mt-2">
              Prioritized list of products that need immediate attention
            </p>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                Total: {totalRecommended}
              </span>
              <span className="bg-red-500/50 px-3 py-1 rounded-full">
                Critical: {criticalCount}
              </span>
              <span className="bg-orange-500/50 px-3 py-1 rounded-full">
                High: {highCount}
              </span>
            </div>
          </div>
          <Button
            onClick={loadRecommendations}
            disabled={refreshing}
            className="bg-white/20 text-white hover:bg-white/30"
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Risk Level:</span>
            <div className="flex gap-2">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedRiskLevel(level)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${
                    selectedRiskLevel === level
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Show:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.product_id}
              className={`bg-white rounded-lg shadow-md overflow-hidden border-t-4 ${
                rec.risk_level === 'critical' ? 'border-red-500' :
                rec.risk_level === 'high' ? 'border-orange-500' :
                rec.risk_level === 'medium' ? 'border-yellow-500' :
                'border-green-500'
              }`}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 truncate" title={rec.product_name}>
                      {rec.product_name}
                    </h3>
                    <p className="text-sm text-gray-500">{rec.sku}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelBgClass(rec.risk_level)}`}>
                    {rec.risk_level}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Current Stock</p>
                    <p className={`text-xl font-bold ${rec.current_stock <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                      {rec.current_stock}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Days Left</p>
                    <p className={`text-xl font-bold ${rec.days_until_stockout <= 3 ? 'text-red-600' : 'text-orange-600'}`}>
                      {formatDaysUntilStockout(rec.days_until_stockout)}
                    </p>
                  </div>
                </div>

                {/* Stockout Date */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Stockout Date: <strong className="text-red-600">{rec.stockout_date}</strong>
                  </p>
                </div>

                {/* Recommendation */}
                <div className="bg-indigo-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600">Recommended Order</p>
                  <p className="text-2xl font-bold text-indigo-600">{rec.recommended_order_quantity} units</p>
                </div>

                {/* Action Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getActionBgClass(rec.action)}`}>
                    {rec.action.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`text-sm font-medium ${
                    rec.urgency === 'high' ? 'text-red-600' :
                    rec.urgency === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {rec.urgency} urgency
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to={`/inventory-analytics/products/${rec.product_id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant={rec.risk_level === 'critical' ? 'destructive' : 'default'}
                    className="flex-1"
                    onClick={() => handleCreatePurchaseOrder(rec.product_id, rec.recommended_order_quantity)}
                  >
                    Create Order
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-12 text-center">
          <p className="text-6xl mb-4">✅</p>
          <h3 className="text-xl font-bold text-gray-800 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">
            No products need reordering at this time. Your inventory is well-managed.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {recommendations.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              <p className="text-sm text-gray-600">Critical</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{highCount}</p>
              <p className="text-sm text-gray-600">High Risk</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {recommendations.reduce((sum, r) => sum + r.recommended_order_quantity, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Units to Order</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{recommendations.length}</p>
              <p className="text-sm text-gray-600">Products Shown</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReorderRecommendationsList;
