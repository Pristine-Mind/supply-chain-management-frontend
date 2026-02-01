import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInventoryAnalytics } from '../../context/InventoryAnalyticsContext';
import {
  getForecastMethodDisplay,
  getRiskLevelBgClass,
} from '../../api/inventoryAnalyticsApi';
import { Button } from '../ui/button';
import BackButton from '../BackButton';
import type { ForecastMethod } from '../../types/inventoryAnalytics';

const BatchForecast: React.FC = () => {
  const { batchForecast, loading, errors, fetchBatchForecast } = useInventoryAnalytics();

  const [productIds, setProductIds] = useState<string>('');
  const [days, setDays] = useState<number>(30);
  const [method, setMethod] = useState<ForecastMethod>('ensemble');
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const ids = productIds
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));
    
    if (ids.length === 0) {
      alert('Please enter at least one valid product ID');
      return;
    }

    await fetchBatchForecast({ product_ids: ids, days });
  };

  useEffect(() => {
    if (batchForecast) {
      setForecasts(batchForecast.forecasts);
      setErrorMessages(batchForecast.errors);
    }
  }, [batchForecast]);

  return (
    <div className="space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 shadow-lg rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">📈 Batch Forecast</h1>
            <p className="text-green-100 mt-2">
              Get demand forecasts for multiple products at once
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Configure Forecast</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product IDs (comma-separated)
            </label>
            <textarea
              value={productIds}
              onChange={(e) => setProductIds(e.target.value)}
              placeholder="e.g., 123, 124, 125, 126"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter up to 50 product IDs separated by commas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forecast Period
              </label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forecast Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as ForecastMethod)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ensemble">Ensemble (Recommended)</option>
                <option value="moving_average">Moving Average</option>
                <option value="exponential_smoothing">Exponential Smoothing</option>
                <option value="seasonal">Seasonal Decomposition</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading.batchForecast}
            className="w-full md:w-auto"
          >
            {loading.batchForecast ? 'Generating Forecasts...' : 'Generate Forecasts'}
          </Button>
        </form>
      </div>

      {/* Errors */}
      {errorMessages.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Warnings</h3>
          <ul className="space-y-1">
            {errorMessages.map((error, idx) => (
              <li key={idx} className="text-sm text-yellow-700">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Results */}
      {errors.batchForecast && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {errors.batchForecast}
        </div>
      )}

      {forecasts.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Forecast Results ({forecasts.length} products)
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Daily Forecast</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">{days}-Day Total</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Method</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((item) => (
                  <tr key={item.product_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{item.product_name}</span>
                      <p className="text-xs text-gray-500">ID: {item.product_id}</p>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="font-semibold text-indigo-600">
                        {item.forecast.daily_forecast.toFixed(1)}
                      </span>
                      <p className="text-xs text-gray-500">units/day</p>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="font-semibold text-green-600">
                        {item.forecast.total_forecast}
                      </span>
                      <p className="text-xs text-gray-500">units</p>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                        {getForecastMethodDisplay(item.forecast.method)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <Link
                        to={`/inventory-analytics/products/${item.product_id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Total Daily Demand</p>
              <p className="text-2xl font-bold text-indigo-600">
                {forecasts.reduce((sum, f) => sum + f.forecast.daily_forecast, 0).toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">units/day</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Total {days}-Day Demand</p>
              <p className="text-2xl font-bold text-green-600">
                {forecasts.reduce((sum, f) => sum + f.forecast.total_forecast, 0)}
              </p>
              <p className="text-xs text-gray-500">units</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Products Forecasted</p>
              <p className="text-2xl font-bold text-blue-600">{forecasts.length}</p>
              <p className="text-xs text-gray-500">products</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchForecast;
