import React, { useEffect, useState } from 'react';
import { getAlertStatistics } from '../../api/riskManagementApi';
import type { AlertStatistics } from '../../types/riskManagement';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Link } from 'react-router-dom';
import BackButton from '../BackButton';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AlertStatisticsPage: React.FC = () => {
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await getAlertStatistics();
      setStatistics(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load alert statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error || 'No statistics available'}
        </div>
        <Link to="/risk-management/alerts" className="mt-4 inline-block text-indigo-600 hover:text-indigo-900">
          ← Back to Alerts
        </Link>
      </div>
    );
  }

  // Status chart data
  const statusChartData = {
    labels: ['Active', 'Acknowledged', 'Resolved'],
    datasets: [
      {
        data: [statistics.active, statistics.acknowledged, statistics.resolved],
        backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(34, 197, 94, 0.8)'],
        borderColor: ['rgb(239, 68, 68)', 'rgb(251, 191, 36)', 'rgb(34, 197, 94)'],
        borderWidth: 1,
      },
    ],
  };

  // Severity chart data
  const severityChartData = {
    labels: ['Critical', 'Warning', 'Info'],
    datasets: [
      {
        data: [statistics.by_severity.critical, statistics.by_severity.warning, statistics.by_severity.info],
        backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(217, 119, 6, 0.8)', 'rgba(59, 130, 246, 0.8)'],
        borderColor: ['rgb(239, 68, 68)', 'rgb(217, 119, 6)', 'rgb(59, 130, 246)'],
        borderWidth: 1,
      },
    ],
  };

  // Type chart data
  const typeChartData = {
    labels: ['OTIF Violation', 'Quality Issue', 'Delivery Delay', 'Inventory Low', 'Supplier Risk'],
    datasets: [
      {
        label: 'Count',
        data: [
          statistics.by_type.otif_violation,
          statistics.by_type.quality_issue,
          statistics.by_type.delivery_delay,
          statistics.by_type.inventory_low,
          statistics.by_type.supplier_risk,
        ],
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
      },
    ],
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="bg-white shadow-md rounded-lg p-6">
        <Link to="/risk-management/alerts" className="text-indigo-600 hover:text-indigo-900 mb-4 inline-block">
          ← Back to Alerts
        </Link>
        <h2 className="text-2xl font-bold text-gray-800">Alert Statistics</h2>
        <Link to="/risk-management/alerts" className="text-amber-600 hover:text-amber-700">
          ← Back to Alerts
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Alerts</h3>
          <div className="text-3xl font-bold text-amber-600">{statistics.total_alerts}</div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active</h3>
          <div className="text-3xl font-bold text-red-600">{statistics.active}</div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Acknowledged</h3>
          <div className="text-3xl font-bold text-yellow-600">{statistics.acknowledged}</div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Resolved</h3>
          <div className="text-3xl font-bold text-green-600">{statistics.resolved}</div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Last 7 Days</h3>
          <div className="text-3xl font-bold text-blue-600">{statistics.last_7_days}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Alerts by Status</h3>
          <div className="flex justify-center">
            <div className="w-64 h-64">
              <Doughnut data={statusChartData} />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Alerts by Severity</h3>
          <div className="flex justify-center">
            <div className="w-64 h-64">
              <Doughnut data={severityChartData} />
            </div>
          </div>
        </div>
      </div>

      {/* Type Distribution */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Alerts by Type</h3>
        <Bar
          data={typeChartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
            },
          }}
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Detailed Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">By Severity</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Critical</span>
                <span className="font-bold text-red-600">{statistics.by_severity.critical}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Warning</span>
                <span className="font-bold text-yellow-600">{statistics.by_severity.warning}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Info</span>
                <span className="font-bold text-blue-600">{statistics.by_severity.info}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">By Type</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">OTIF Violation</span>
                <span className="font-bold text-gray-900">{statistics.by_type.otif_violation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Quality Issue</span>
                <span className="font-bold text-gray-900">{statistics.by_type.quality_issue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Delivery Delay</span>
                <span className="font-bold text-gray-900">{statistics.by_type.delivery_delay}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Inventory Low</span>
                <span className="font-bold text-gray-900">{statistics.by_type.inventory_low}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Supplier Risk</span>
                <span className="font-bold text-gray-900">{statistics.by_type.supplier_risk}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertStatisticsPage;
