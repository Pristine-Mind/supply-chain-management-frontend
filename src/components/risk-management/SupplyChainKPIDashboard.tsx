import React, { useEffect, useState } from 'react';
import { getCurrentKPI, getKPITrends } from '../../api/riskManagementApi';
import type { SupplyChainKPI } from '../../types/riskManagement';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import BackButton from '../BackButton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SupplyChainKPIDashboard: React.FC = () => {
  const [currentKPI, setCurrentKPI] = useState<SupplyChainKPI | null>(null);
  const [trends, setTrends] = useState<SupplyChainKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKPIData();
  }, []);

  const loadKPIData = async () => {
    try {
      setLoading(true);
      const [current, trendData] = await Promise.all([getCurrentKPI(), getKPITrends()]);
      setCurrentKPI(current);
      setTrends(trendData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  };

  const getTrendColor = (trend: number, isPositive: boolean = true) => {
    if (trend === 0) return 'text-gray-500';
    const isGood = isPositive ? trend > 0 : trend < 0;
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !currentKPI) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error || 'No KPI data available'}
        </div>
      </div>
    );
  }

  // Prepare chart data for OTIF
  const otifChartData = {
    labels: trends.map((t) => new Date(t.snapshot_date).toLocaleDateString()).reverse(),
    datasets: [
      {
        label: 'OTIF Rate (%)',
        data: trends.map((t) => t.otif_rate).reverse(),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // Prepare chart data for Lead Time
  const leadTimeChartData = {
    labels: trends.map((t) => new Date(t.snapshot_date).toLocaleDateString()).reverse(),
    datasets: [
      {
        label: 'Average Lead Time (days)',
        data: trends.map((t) => t.lead_time_avg).reverse(),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // Prepare chart data for Inventory Turnover
  const inventoryChartData = {
    labels: trends.map((t) => new Date(t.snapshot_date).toLocaleDateString()).reverse(),
    datasets: [
      {
        label: 'Inventory Turnover Ratio',
        data: trends.map((t) => t.inventory_turnover_ratio).reverse(),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Supply Chain KPIs</h2>
            <p className="text-gray-500 mt-1">
              {currentKPI.supplier_name} • {new Date(currentKPI.snapshot_date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={loadKPIData}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* OTIF Rate */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">OTIF Rate</h3>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold text-gray-900">{currentKPI.otif_rate.toFixed(1)}%</div>
            <span className={`text-sm font-semibold ${getTrendColor(currentKPI.otif_trend_pct, true)}`}>
              {getTrendIcon(currentKPI.otif_trend_pct)} {Math.abs(currentKPI.otif_trend_pct).toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">vs. {currentKPI.otif_previous.toFixed(1)}% previous</p>
          {trends.length > 0 && (
            <div className="mt-4 h-20">
              <Line data={otifChartData} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Lead Time */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Average Lead Time</h3>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold text-gray-900">{currentKPI.lead_time_avg.toFixed(1)}</div>
            <span className="text-sm text-gray-600">days</span>
            <span className={`text-sm font-semibold ${getTrendColor(currentKPI.lead_time_trend, false)}`}>
              {getTrendIcon(currentKPI.lead_time_trend)} {Math.abs(currentKPI.lead_time_trend).toFixed(1)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">Variability: {currentKPI.lead_time_variability.toFixed(2)} days</p>
          {trends.length > 0 && (
            <div className="mt-4 h-20">
              <Line data={leadTimeChartData} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Inventory Turnover */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Inventory Turnover</h3>
          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-bold text-gray-900">{currentKPI.inventory_turnover_ratio.toFixed(1)}</div>
            <span className={`text-sm font-semibold ${getTrendColor(currentKPI.inventory_trend_pct, true)}`}>
              {getTrendIcon(currentKPI.inventory_trend_pct)} {Math.abs(currentKPI.inventory_trend_pct).toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            vs. {currentKPI.inventory_turnover_previous.toFixed(1)} previous
          </p>
          {trends.length > 0 && (
            <div className="mt-4 h-20">
              <Line data={inventoryChartData} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Stock Issues */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Stock Issues</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Stock-Out Incidents</p>
              <p className="text-2xl font-bold text-red-600">{currentKPI.stock_out_incidents}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Low Stock Items</p>
              <p className="text-lg font-semibold text-yellow-600">{currentKPI.low_stock_items_count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Order Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Orders</span>
              <span className="text-2xl font-bold text-blue-600">{currentKPI.orders_pending_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Delayed Orders</span>
              <span className="text-2xl font-bold text-red-600">{currentKPI.orders_delayed_count}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Period Information</h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Period Start</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(currentKPI.period_start).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Period End</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(currentKPI.period_end).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(currentKPI.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainKPIDashboard;
