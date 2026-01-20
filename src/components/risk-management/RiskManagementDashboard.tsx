import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getRiskDashboardSummary,
  getHealthStatusColor,
  getAlertSeverityColor,
  getRiskLevelColor,
} from '../../api/riskManagementApi';
import type { RiskDashboardSummary } from '../../types/riskManagement';
import { Line, Doughnut } from 'react-chartjs-2';
import BackButton from '../BackButton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const RiskManagementDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<RiskDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setRefreshing(true);
      const data = await getRiskDashboardSummary();
      setDashboard(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Risk Intelligence Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error || 'Unable to load dashboard'}
        </div>
      </div>
    );
  }

  const { supplier_scorecard, kpis, risk_overview } = dashboard;

  // Alert distribution chart
    const alertChartData = {
    labels: ['Critical', 'Warning', 'Info'],
    datasets: [
      {
        data: [dashboard.critical_alerts, dashboard.warning_alerts, dashboard.info_alerts],
        backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(217, 119, 6, 0.8)', 'rgba(59, 130, 246, 0.8)'],
        borderColor: ['rgb(239, 68, 68)', 'rgb(217, 119, 6)', 'rgb(59, 130, 246)'],
        borderWidth: 1,
      },
    ],
  };

  const getHealthBadge = (status?: string) => {
    if (!status) return null;
    const color = getHealthStatusColor(status);
    const colorMap: Record<string, string> = {
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colorMap[color] || colorMap.gray;
  };

  const getRiskBadge = (level?: string) => {
    if (!level) return null;
    const color = getRiskLevelColor(level);
    const colorMap: Record<string, string> = {
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🎯 Risk Intelligence Dashboard</h1>
            <p className="text-indigo-100 mt-2">
              Real-time supply chain risk monitoring and analytics
            </p>
            <p className="text-indigo-200 text-sm mt-1">
              Last updated: {new Date(dashboard.timestamp).toLocaleString()}
            </p>
          </div>
          <button
            onClick={loadDashboard}
            disabled={refreshing}
            className="px-6 py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 transition font-semibold"
          >
            {refreshing ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Critical Alerts</h3>
          <div className="text-4xl font-bold text-red-600">{dashboard.critical_alerts}</div>
          <Link to="/risk-management/alerts?severity=critical" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
            View All →
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-amber-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Warning Alerts</h3>
          <div className="text-4xl font-bold text-amber-600">{dashboard.warning_alerts}</div>
          <Link to="/risk-management/alerts?severity=warning" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
            View All →
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Info Alerts</h3>
          <div className="text-4xl font-bold text-blue-600">{dashboard.info_alerts}</div>
          <Link to="/risk-management/alerts?severity=info" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
            View All →
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-gray-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Alerts</h3>
          <div className="text-4xl font-bold text-gray-900">{dashboard.total_alerts}</div>
          <Link to="/risk-management/alerts" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
            View All →
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Scorecard */}
        {supplier_scorecard && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">Supplier Health</h3>
              <Link to="/risk-management/scorecards" className="text-indigo-600 hover:underline text-sm">
                View Details →
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Health Score</span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-indigo-600">
                    {supplier_scorecard.health_score.toFixed(1)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getHealthBadge(supplier_scorecard.health_status)}`}>
                    {supplier_scorecard.health_status_display}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">On-Time Delivery</span>
                  <span className="font-semibold">{supplier_scorecard.on_time_delivery_pct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${supplier_scorecard.on_time_delivery_pct}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quality Performance</span>
                  <span className="font-semibold">{supplier_scorecard.quality_performance_pct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${supplier_scorecard.quality_performance_pct}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lead Time Consistency</span>
                  <span className="font-semibold">{supplier_scorecard.lead_time_consistency_pct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${supplier_scorecard.lead_time_consistency_pct}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Distribution */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Alert Distribution</h3>
          <div className="flex justify-center">
            <div className="w-64 h-64">
              <Doughnut data={alertChartData} />
            </div>
          </div>
        </div>
      </div>

      {/* KPIs and Risk Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Performance Indicators */}
        {kpis && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">Key Performance Indicators</h3>
              <Link to="/risk-management/kpis" className="text-indigo-600 hover:underline text-sm">
                View Details →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">OTIF Rate</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.otif_rate.toFixed(1)}%</p>
                <p className={`text-xs ${kpis.otif_trend_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.otif_trend_pct >= 0 ? '↑' : '↓'} {Math.abs(kpis.otif_trend_pct).toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Avg Lead Time</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.lead_time_avg.toFixed(1)}</p>
                <p className={`text-xs ${kpis.lead_time_trend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.lead_time_trend <= 0 ? '↓' : '↑'} {Math.abs(kpis.lead_time_trend).toFixed(1)} days
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Inventory Turnover</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.inventory_turnover_ratio.toFixed(1)}</p>
                <p className={`text-xs ${kpis.inventory_trend_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.inventory_trend_pct >= 0 ? '↑' : '↓'} {Math.abs(kpis.inventory_trend_pct).toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Stock-Out Incidents</p>
                <p className="text-2xl font-bold text-red-600">{kpis.stock_out_incidents}</p>
                <p className="text-xs text-gray-500">Low Stock: {kpis.low_stock_items_count}</p>
              </div>
            </div>
          </div>
        )}

        {/* Risk Overview */}
        {risk_overview && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">Risk Overview</h3>
              <Link to="/risk-management/risks" className="text-indigo-600 hover:underline text-sm">
                View Details →
              </Link>
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Overall Risk Score</span>
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-indigo-600">
                    {risk_overview.overall_risk_score.toFixed(1)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadge(risk_overview.overall_risk_level)}`}>
                    {risk_overview.overall_risk_level_display}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Supplier Risk</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadge(risk_overview.supplier_risk_level)}`}>
                  {risk_overview.supplier_risk_level_display}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Logistics Risk</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadge(risk_overview.logistics_risk_level)}`}>
                  {risk_overview.logistics_risk_level_display}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Demand Risk</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadge(risk_overview.demand_risk_level)}`}>
                  {risk_overview.demand_risk_level_display}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Inventory Risk</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadge(risk_overview.inventory_risk_level)}`}>
                  {risk_overview.inventory_risk_level_display}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/risk-management/scorecards"
            className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-center"
          >
            📊 Scorecards
          </Link>
          <Link
            to="/risk-management/kpis"
            className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-center"
          >
            📈 KPIs
          </Link>
          <Link
            to="/risk-management/alerts"
            className="px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-center"
          >
            🔔 Alerts
          </Link>
          <Link
            to="/risk-management/risks"
            className="px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition text-center"
          >
            ⚠️ Risks
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RiskManagementDashboard;
