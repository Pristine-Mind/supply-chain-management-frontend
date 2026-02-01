import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInventoryAnalytics } from '../../context/InventoryAnalyticsContext';
import {
  getRiskLevelBgClass,
  getActionBgClass,
  formatDaysUntilStockout,
} from '../../api/inventoryAnalyticsApi';
import { Doughnut, Bar } from 'react-chartjs-2';
import BackButton from '../BackButton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const InventoryAnalyticsDashboard: React.FC = () => {
  const {
    portfolioAnalytics,
    reorderRecommendations,
    loading,
    errors,
    fetchPortfolioAnalytics,
    fetchReorderRecommendations,
  } = useInventoryAnalytics();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setRefreshing(true);
    await Promise.all([fetchPortfolioAnalytics(), fetchReorderRecommendations({ limit: 10 })]);
    setRefreshing(false);
  };

  if (loading.portfolioAnalytics && !portfolioAnalytics) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Inventory Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  if (errors.portfolioAnalytics || !portfolioAnalytics) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {errors.portfolioAnalytics || 'Unable to load dashboard'}
        </div>
      </div>
    );
  }

  const { portfolio_analytics } = portfolioAnalytics;
  const { recommendations } = reorderRecommendations || { recommendations: [] };

  // Risk distribution chart
  const riskChartData = {
    labels: ['Critical', 'High', 'Medium', 'Healthy'],
    datasets: [
      {
        data: [
          portfolio_analytics.stockout_risk_count,
          portfolio_analytics.reorder_needed_count - portfolio_analytics.stockout_risk_count,
          portfolio_analytics.low_stock_count,
          portfolio_analytics.total_products - portfolio_analytics.low_stock_count - portfolio_analytics.reorder_needed_count,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Red - Critical
          'rgba(249, 115, 22, 0.8)',  // Orange - High
          'rgba(234, 179, 8, 0.8)',   // Yellow - Medium
          'rgba(34, 197, 94, 0.8)',   // Green - Healthy
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(249, 115, 22)',
          'rgb(234, 179, 8)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // At-risk products bar chart
  const atRiskChartData = {
    labels: portfolio_analytics.at_risk_products.slice(0, 5).map(p => p.name.substring(0, 15)),
    datasets: [
      {
        label: 'Days Until Stockout',
        data: portfolio_analytics.at_risk_products.slice(0, 5).map(p => p.days_until_stockout),
        backgroundColor: portfolio_analytics.at_risk_products.slice(0, 5).map(p =>
          p.risk_level === 'critical' ? 'rgba(239, 68, 68, 0.8)' :
          p.risk_level === 'high' ? 'rgba(249, 115, 22, 0.8)' :
          'rgba(234, 179, 8, 0.8)'
        ),
        borderColor: portfolio_analytics.at_risk_products.slice(0, 5).map(p =>
          p.risk_level === 'critical' ? 'rgb(239, 68, 68)' :
          p.risk_level === 'high' ? 'rgb(249, 115, 22)' :
          'rgb(234, 179, 8)'
        ),
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">📊 Predictive Inventory Analytics</h1>
            <p className="text-indigo-100 mt-2">
              ML-based demand forecasting, stockout prediction, and optimization
            </p>
          </div>
          <button
            onClick={loadDashboard}
            disabled={refreshing}
            className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition font-semibold backdrop-blur-sm"
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Products</h3>
          <div className="text-4xl font-bold text-gray-900">{portfolio_analytics.total_products}</div>
          <Link to="/inventory-analytics/products" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
            View All →
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Healthy Stock</h3>
          <div className="text-4xl font-bold text-green-600">
            {portfolio_analytics.healthy_stock_percentage.toFixed(1)}%
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {portfolio_analytics.total_products - portfolio_analytics.low_stock_count} products
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-yellow-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Low Stock</h3>
          <div className="text-4xl font-bold text-yellow-600">{portfolio_analytics.low_stock_count}</div>
          <p className="text-sm text-gray-500 mt-2">Products need attention</p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Critical Risk</h3>
          <div className="text-4xl font-bold text-red-600">{portfolio_analytics.stockout_risk_count}</div>
          <Link to="/inventory-analytics/reorder-recommendations?risk_level=critical" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
            View Urgent →
          </Link>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Portfolio Risk Distribution</h3>
          <div className="flex justify-center">
            <div className="w-64 h-64">
              <Doughnut data={riskChartData} />
            </div>
          </div>
        </div>

        {/* At-Risk Products */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Days Until Stockout (Top 5)</h3>
          {portfolio_analytics.at_risk_products.length > 0 ? (
            <div className="h-64">
              <Bar
                data={atRiskChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'Days' },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No at-risk products
            </div>
          )}
        </div>
      </div>

      {/* At-Risk Products Table */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">At-Risk Products</h3>
          <Link
            to="/inventory-analytics/reorder-recommendations"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
          >
            View All Recommendations
          </Link>
        </div>
        
        {portfolio_analytics.at_risk_products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Stock</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Risk Level</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Days Left</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {portfolio_analytics.at_risk_products.slice(0, 10).map((product) => (
                  <tr key={product.product_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-semibold ${product.stock <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRiskLevelBgClass(product.risk_level)}`}>
                        {product.risk_level}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-medium ${product.days_until_stockout <= 3 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDaysUntilStockout(product.days_until_stockout)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <Link
                        to={`/inventory-analytics/products/${product.product_id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">✅</p>
            <p>No at-risk products. Your inventory is healthy!</p>
          </div>
        )}
      </div>

      {/* Quick Reorder Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Priority Reorder Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 6).map((rec) => (
              <div
                key={rec.product_id}
                className={`p-4 rounded-lg border-2 ${
                  rec.risk_level === 'critical' ? 'border-red-200 bg-red-50' :
                  rec.risk_level === 'high' ? 'border-orange-200 bg-orange-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900 truncate" title={rec.product_name}>
                    {rec.product_name}
                  </h4>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelBgClass(rec.risk_level)}`}>
                    {rec.risk_level}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">SKU: {rec.sku}</p>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-600">Stock: <strong>{rec.current_stock}</strong></span>
                  <span className="text-gray-600">Days: <strong className={rec.days_until_stockout <= 3 ? 'text-red-600' : ''}>
                    {formatDaysUntilStockout(rec.days_until_stockout)}
                  </strong></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-indigo-600">
                    Order: {rec.recommended_order_quantity} units
                  </span>
                  <Link
                    to={`/inventory-analytics/products/${rec.product_id}`}
                    className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/inventory-analytics/products"
            className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-center font-medium"
          >
            📦 Products
          </Link>
          <Link
            to="/inventory-analytics/reorder-recommendations"
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-center font-medium"
          >
            🚨 Reorder Now
          </Link>
          <Link
            to="/inventory-analytics/batch-forecast"
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center font-medium"
          >
            📈 Batch Forecast
          </Link>
          <Link
            to="/inventory-analytics/portfolio"
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center font-medium"
          >
            📊 Portfolio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InventoryAnalyticsDashboard;
