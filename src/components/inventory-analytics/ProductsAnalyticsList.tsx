import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInventoryAnalytics } from '../../context/InventoryAnalyticsContext';
import {
  getRiskLevelBgClass,
  getActionBgClass,
  formatDaysUntilStockout,
} from '../../api/inventoryAnalyticsApi';
import { Button } from '../ui/button';
import BackButton from '../BackButton';
import type { RiskLevel } from '../../types/inventoryAnalytics';

// Extended product interface for the list view
interface ProductWithAnalytics {
  product_id: number;
  name: string;
  sku: string;
  current_stock: number;
  risk_level: RiskLevel;
  days_until_stockout: number;
  daily_forecast: number;
  action_required: string;
}

const ProductsAnalyticsList: React.FC = () => {
  const { portfolioAnalytics, reorderRecommendations, loading, errors, fetchPortfolioAnalytics, fetchReorderRecommendations } = useInventoryAnalytics();

  const [allProducts, setAllProducts] = useState<ProductWithAnalytics[]>([]);
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'risk' | 'stock' | 'forecast' | 'name'>('risk');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchPortfolioAnalytics(),
      fetchReorderRecommendations({ limit: 100 }),
    ]);
  };

  useEffect(() => {
    if (portfolioAnalytics && reorderRecommendations) {
      // Combine at-risk products from portfolio with recommendations
      const atRiskProducts = portfolioAnalytics.portfolio_analytics.at_risk_products;
      const recommendations = reorderRecommendations.recommendations;
      
      // Create a map of all products with analytics
      const productMap = new Map<number, ProductWithAnalytics>();
      
      atRiskProducts.forEach(product => {
        productMap.set(product.product_id, {
          product_id: product.product_id,
          name: product.name,
          sku: '', // Will be filled from recommendations if available
          current_stock: product.stock,
          risk_level: product.risk_level,
          days_until_stockout: product.days_until_stockout,
          daily_forecast: 0,
          action_required: 'monitor',
        });
      });

      // Enhance with recommendation data
      recommendations.forEach(rec => {
        const existing = productMap.get(rec.product_id);
        if (existing) {
          existing.sku = rec.sku;
          existing.daily_forecast = rec.recommended_order_quantity > 0 
            ? Math.round(rec.recommended_order_quantity / 12) // Estimate
            : 0;
          existing.action_required = rec.action;
        } else {
          productMap.set(rec.product_id, {
            product_id: rec.product_id,
            name: rec.product_name,
            sku: rec.sku,
            current_stock: rec.current_stock,
            risk_level: rec.risk_level,
            days_until_stockout: rec.days_until_stockout,
            daily_forecast: rec.recommended_order_quantity > 0 
              ? Math.round(rec.recommended_order_quantity / 12)
              : 0,
            action_required: rec.action,
          });
        }
      });

      setAllProducts(Array.from(productMap.values()));
    }
  }, [portfolioAnalytics, reorderRecommendations]);

  // Filter and sort products
  const filteredProducts = allProducts
    .filter(product => {
      if (filter !== 'all' && product.risk_level !== filter) return false;
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'risk':
          const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return riskOrder[a.risk_level] - riskOrder[b.risk_level];
        case 'stock':
          return a.current_stock - b.current_stock;
        case 'forecast':
          return b.daily_forecast - a.daily_forecast;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  if (loading.portfolioAnalytics && !portfolioAnalytics) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (errors.portfolioAnalytics) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <BackButton />
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mt-4">
          {errors.portfolioAnalytics}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">📦 Products with Analytics</h1>
            <p className="text-indigo-100 mt-2">
              View forecast and stockout predictions for all products
            </p>
          </div>
          <Button
            onClick={loadData}
            disabled={loading.portfolioAnalytics}
            className="bg-white/20 text-white hover:bg-white/30"
          >
            {loading.portfolioAnalytics ? '🔄 Refreshing...' : '🔄 Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Risk Level:</span>
            <div className="flex gap-2">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${
                    filter === level
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="risk">Sort by Risk</option>
              <option value="stock">Sort by Stock</option>
              <option value="forecast">Sort by Forecast</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow-md rounded-lg p-6">
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Stock</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Risk Level</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Days Left</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Est. Daily Demand</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.product_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{product.name}</span>
                      {product.sku && (
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-semibold ${product.current_stock <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.current_stock}
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
                    <td className="text-center py-3 px-4">
                      <span className="font-semibold text-indigo-600">
                        {product.daily_forecast > 0 ? product.daily_forecast.toFixed(1) : 'N/A'}
                      </span>
                      {product.daily_forecast > 0 && (
                        <p className="text-xs text-gray-500">units/day</p>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionBgClass(product.action_required)}`}>
                        {product.action_required.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <Link
                        to={`/inventory-analytics/products/${product.product_id}`}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                      >
                        View Forecast
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-6xl mb-4">📊</p>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Products Found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'No products match your search criteria.' 
                : 'No products with analytics data available.'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredProducts.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{filteredProducts.length}</p>
              <p className="text-sm text-gray-600">Products Shown</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {filteredProducts.filter(p => p.risk_level === 'critical').length}
              </p>
              <p className="text-sm text-gray-600">Critical Risk</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {filteredProducts.filter(p => p.risk_level === 'high').length}
              </p>
              <p className="text-sm text-gray-600">High Risk</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-2xl font-bold text-indigo-600">
                {filteredProducts.reduce((sum, p) => sum + p.current_stock, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Stock</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsAnalyticsList;
