import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInventoryAnalytics } from '../../context/InventoryAnalyticsContext';
import {
  getRiskLevelBgClass,
  getActionBgClass,
  formatDaysUntilStockout,
  getForecastMethodDisplay,
  getTrendIcon,
  getTrendColor,
} from '../../api/inventoryAnalyticsApi';
import { Bar, Line } from 'react-chartjs-2';
import BackButton from '../BackButton';
import { Button } from '../ui/button';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const ProductAnalyticsDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const {
    fullAnalytics,
    loading,
    errors,
    fetchFullProductAnalytics,
    applyOptimizationSettings,
  } = useInventoryAnalytics();

  const [selectedMethod, setSelectedMethod] = useState<string>('ensemble');
  const [forecastDays, setForecastDays] = useState<number>(30);
  const [applyingOptimization, setApplyingOptimization] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchFullProductAnalytics(Number(productId));
    }
  }, [productId]);

  const handleApplyOptimization = async () => {
    if (!productId) return;
    setApplyingOptimization(true);
    await applyOptimizationSettings(Number(productId), {
      apply_reorder_point: true,
      apply_safety_stock: true,
      apply_reorder_quantity: true,
    });
    setApplyingOptimization(false);
  };

  const handleRefreshForecast = () => {
    if (productId) {
      // Refetch with new parameters
      fetchFullProductAnalytics(Number(productId));
    }
  };

  if (loading.fullAnalytics) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product analytics...</p>
        </div>
      </div>
    );
  }

  if (errors.fullAnalytics || !fullAnalytics) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <BackButton />
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mt-4">
          <p className="font-semibold mb-2">⚠️ {errors.fullAnalytics || 'No analytics data available'}</p>
          <p className="text-sm text-red-600 mb-4">
            This could mean the analytics API is not available for this product yet.
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={handleRefreshForecast}
              variant="outline"
              size="sm"
            >
              🔄 Retry
            </Button>
            <Link 
              to="/products"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
            >
              ← Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { product, demand_forecast, stockout_prediction, optimization, seasonality, trends } = fullAnalytics;

  // Seasonality chart data
  const seasonalityChartData = seasonality?.daily_averages ? {
    labels: Object.keys(seasonality.daily_averages),
    datasets: [
      {
        label: 'Average Daily Sales',
        data: Object.values(seasonality.daily_averages),
        backgroundColor: Object.keys(seasonality.daily_averages).map(day =>
          day === seasonality.peak_day ? 'rgba(34, 197, 94, 0.8)' :
          day === seasonality.low_day ? 'rgba(239, 68, 68, 0.8)' :
          'rgba(99, 102, 241, 0.6)'
        ),
        borderColor: Object.keys(seasonality.daily_averages).map(day =>
          day === seasonality.peak_day ? 'rgb(34, 197, 94)' :
          day === seasonality.low_day ? 'rgb(239, 68, 68)' :
          'rgb(99, 102, 241)'
        ),
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-blue-100 mt-1">SKU: {product.sku}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm">Current Stock: <strong>{product.current_stock}</strong></span>
              <span className="text-sm">Reorder Point: <strong>{product.reorder_point}</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getRiskLevelBgClass(stockout_prediction.risk_level)}`}>
              {stockout_prediction.risk_level.toUpperCase()} RISK
            </span>
          </div>
        </div>
      </div>

      {/* Stockout Alert */}
      {stockout_prediction.will_stockout && (
        <div className={`p-4 rounded-lg border-l-4 ${
          stockout_prediction.risk_level === 'critical' ? 'bg-red-50 border-red-500' :
          stockout_prediction.risk_level === 'high' ? 'bg-orange-50 border-orange-500' :
          'bg-yellow-50 border-yellow-500'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-lg">
                Stockout Predicted in {formatDaysUntilStockout(stockout_prediction.days_until_stockout)}
              </h3>
              <p className="text-gray-700 mt-1">
                Expected stockout date: <strong>{stockout_prediction.stockout_date}</strong>
              </p>
              <p className="text-gray-600 mt-2">
                Daily demand forecast: <strong>{stockout_prediction.daily_demand_forecast.toFixed(1)}</strong> units
              </p>
              {stockout_prediction.recommended_reorder_date && (
                <p className="text-indigo-600 font-medium mt-2">
                  📅 Recommended reorder by: {stockout_prediction.recommended_reorder_date}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demand Forecast */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Demand Forecast</h3>
            <div className="flex gap-2">
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="ensemble">Ensemble</option>
                <option value="moving_average">Moving Average</option>
                <option value="exponential_smoothing">Exp. Smoothing</option>
                <option value="seasonal">Seasonal</option>
              </select>
              <Button size="sm" onClick={handleRefreshForecast}>Update</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Daily Forecast</p>
              <p className="text-2xl font-bold text-indigo-600">{demand_forecast.daily_forecast.toFixed(1)}</p>
              <p className="text-xs text-gray-500">units/day</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">{demand_forecast.forecast_period_days}-Day Total</p>
              <p className="text-2xl font-bold text-green-600">{demand_forecast.total_forecast}</p>
              <p className="text-xs text-gray-500">units</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Confidence Interval</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: '60%', marginLeft: '20%' }}
                ></div>
              </div>
              <span className="text-sm font-medium">
                {demand_forecast.confidence_interval[0].toFixed(1)} - {demand_forecast.confidence_interval[1].toFixed(1)}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Method: {getForecastMethodDisplay(demand_forecast.method)}
          </p>
        </div>

        {/* Optimization */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Optimization</h3>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getActionBgClass(optimization.action_required)}`}>
              {optimization.action_required.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Optimal Reorder Point</span>
              <span className="text-xl font-bold text-indigo-600">{optimization.reorder_point}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Economic Order Qty (EOQ)</span>
              <span className="text-xl font-bold text-green-600">{optimization.economic_order_quantity}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Recommended Safety Stock</span>
              <span className="text-xl font-bold text-blue-600">{optimization.safety_stock}</span>
            </div>
          </div>

          {optimization.recommendations.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
              <ul className="space-y-1">
                {optimization.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span>💡</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            className="w-full mt-4"
            onClick={handleApplyOptimization}
            disabled={applyingOptimization}
          >
            {applyingOptimization ? 'Applying...' : 'Apply Recommendations'}
          </Button>
        </div>
      </div>

      {/* Seasonality & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seasonality */}
        {seasonalityChartData && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Weekly Seasonality</h3>
            <div className="h-64">
              <Bar
                data={seasonalityChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'Avg Daily Sales' },
                    },
                  },
                }}
              />
            </div>
            <div className="flex justify-between mt-4 text-sm">
              <span className="text-green-600">▲ Peak: {seasonality.peak_day}</span>
              <span className="text-red-600">▼ Low: {seasonality.low_day}</span>
              <span className="text-gray-600">Ratio: {seasonality.peak_to_low_ratio.toFixed(1)}x</span>
            </div>
          </div>
        )}

        {/* Trends */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Demand Trend</h3>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className={`text-6xl mb-4 ${
                getTrendColor(trends.trend) === 'green' ? 'text-green-500' :
                getTrendColor(trends.trend) === 'red' ? 'text-red-500' :
                'text-gray-500'
              }`}>
                {getTrendIcon(trends.trend)}
              </div>
              <p className="text-2xl font-bold text-gray-900 capitalize">{trends.trend}</p>
              <p className={`text-lg font-medium ${
                (trends.change_percentage ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(trends.change_percentage ?? 0) >= 0 ? '+' : ''}{(trends.change_percentage ?? 0).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Previous Period</p>
              <p className="font-semibold">{(trends.first_period_avg ?? 0).toFixed(1)}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Current Period</p>
              <p className="font-semibold">{(trends.second_period_avg ?? 0).toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Product Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link
            to={`/products/${productId}`}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Edit Product
          </Link>
          <Link
            to="/inventory-analytics/reorder-recommendations"
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            View Reorder List
          </Link>
          <Link
            to="/inventory-analytics/batch-forecast"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            Batch Forecast
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalyticsDetail;
