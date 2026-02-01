import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInventoryAnalytics } from '../../context/InventoryAnalyticsContext';
import {
  getRiskLevelBgClass,
  formatDaysUntilStockout,
} from '../../api/inventoryAnalyticsApi';
import { Bar, Doughnut } from 'react-chartjs-2';
import BackButton from '../BackButton';
import { Button } from '../ui/button';
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
import type { RiskLevel } from '../../types/inventoryAnalytics';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const PortfolioView: React.FC = () => {
  const { portfolioAnalytics, loading, errors, fetchPortfolioAnalytics } = useInventoryAnalytics();
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    setRefreshing(true);
    await fetchPortfolioAnalytics();
    setRefreshing(false);
  };

  const handleFilterChange = (level: RiskLevel | 'all') => {
    setSelectedRiskLevel(level);
  };

  if (loading.portfolioAnalytics && !portfolioAnalytics) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolio analytics...</p>
        </div>
      </div>
    );
  }

  if (errors.portfolioAnalytics || !portfolioAnalytics) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <BackButton />
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mt-4">
          {errors.portfolioAnalytics || 'Unable to load portfolio'}
        </div>
      </div>
    );
  }

  const { portfolio_analytics, generated_at } = portfolioAnalytics;

  // Filter at-risk products
  const filteredProducts = selectedRiskLevel === 'all'
    ? portfolio_analytics.at_risk_products
    : portfolio_analytics.at_risk_products.filter(p => p.risk_level === selectedRiskLevel);

  // Calculate risk distribution
  const riskCounts = {
    critical: portfolio_analytics.at_risk_products.filter(p => p.risk_level === 'critical').length,
    high: portfolio_analytics.at_risk_products.filter(p => p.risk_level === 'high').length,
    medium: portfolio_analytics.at_risk_products.filter(p => p.risk_level === 'medium').length,
    low: portfolio_analytics.at_risk_products.filter(p => p.risk_level === 'low').length,
  };

  const healthyCount = portfolio_analytics.total_products - portfolio_analytics.at_risk_products.length;

  // Chart data
  const riskDistributionData = {
    labels: ['Critical', 'High', 'Medium', 'Low', 'Healthy'],
    datasets: [
      {
        data: [riskCounts.critical, riskCounts.high, riskCounts.medium, riskCounts.low, healthyCount],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Critical - Red
          'rgba(249, 115, 22, 0.8)',  // High - Orange
          'rgba(234, 179, 8, 0.8)',   // Medium - Yellow
          'rgba(59, 130, 246, 0.8)',  // Low - Blue
          'rgba(34, 197, 94, 0.8)',   // Healthy - Green
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(249, 115, 22)',
          'rgb(234, 179, 8)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Stock level distribution
  const stockDistribution = {
    labels: ['Critical (≤10)', 'Low (11-20)', 'Medium (21-50)', 'Healthy (>50)'],
    datasets: [
      {
        label: 'Products',
        data: [
          portfolio_analytics.at_risk_products.filter(p => p.stock <= 10).length,
          portfolio_analytics.at_risk_products.filter(p => p.stock > 10 && p.stock <= 20).length,
          portfolio_analytics.at_risk_products.filter(p => p.stock > 20 && p.stock <= 50).length,
          portfolio_analytics.total_products - portfolio_analytics.at_risk_products.filter(p => p.stock <= 50).length,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">📊 Portfolio Overview</h1>
            <p className="text-purple-100 mt-2">
              Complete inventory health analysis across all products
            </p>
            <p className="text-purple-200 text-sm mt-1">
              Last updated: {new Date(generated_at).toLocaleString()}
            </p>
          </div>
          <Button
            onClick={loadPortfolio}
            disabled={refreshing}
            className="bg-white/20 text-white hover:bg-white/30"
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-3xl font-bold text-gray-900">{portfolio_analytics.total_products}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Healthy</p>
          <p className="text-3xl font-bold text-green-600">
            {portfolio_analytics.healthy_stock_percentage.toFixed(0)}%
          </p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="text-3xl font-bold text-yellow-600">{portfolio_analytics.low_stock_count}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Critical Risk</p>
          <p className="text-3xl font-bold text-red-600">{portfolio_analytics.stockout_risk_count}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Risk Distribution</h3>
          <div className="flex justify-center">
            <div className="w-64 h-64">
              <Doughnut data={riskDistributionData} />
            </div>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Stock Level Distribution</h3>
          <div className="h-64">
            <Bar
              data={stockDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
      </div>

      {/* At-Risk Products Table */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            At-Risk Products ({filteredProducts.length})
          </h3>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((level) => (
              <Button
                key={level}
                size="sm"
                variant={selectedRiskLevel === level ? 'default' : 'outline'}
                onClick={() => handleFilterChange(level)}
                className={level === 'critical' ? 'hover:bg-red-600' : ''}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                {level !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({riskCounts[level]})
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Stock</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Risk Level</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Days Left</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
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
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-2">✅</p>
            <p>No products match the selected filter.</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/inventory-analytics/reorder-recommendations">
            <Button variant="destructive">🚨 View Reorder Recommendations</Button>
          </Link>
          <Link to="/inventory-analytics/batch-forecast">
            <Button variant="default">📈 Batch Forecast</Button>
          </Link>
          <Link to="/inventory-analytics">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PortfolioView;
