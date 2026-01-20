import React, { useEffect, useState } from 'react';
import { compareScorecards } from '../../api/riskManagementApi';
import type { ScorecardComparison } from '../../types/riskManagement';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Link } from 'react-router-dom';
import BackButton from '../BackButton';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ScorecardComparison: React.FC = () => {
  const [comparisons, setComparisons] = useState<ScorecardComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplierIds, setSupplierIds] = useState<string>('');

  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = async (ids?: string) => {
    try {
      setLoading(true);
      const data = await compareScorecards(ids ? { supplier_ids: ids } : {});
      setComparisons(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = () => {
    loadComparisons(supplierIds);
  };

  if (loading && comparisons.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: comparisons.map((c) => c.supplier_name),
    datasets: [
      {
        label: 'Health Score',
        data: comparisons.map((c) => c.health_score),
        backgroundColor: 'rgba(217, 119, 6, 0.8)',
      },
      {
        label: 'On-Time Delivery %',
        data: comparisons.map((c) => c.on_time_delivery_pct),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
      {
        label: 'Quality Performance %',
        data: comparisons.map((c) => c.quality_performance_pct),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
      },
      {
        label: 'Lead Time Consistency %',
        data: comparisons.map((c) => c.lead_time_consistency_pct),
        backgroundColor: 'rgba(236, 72, 153, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Supplier Performance Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Compare Supplier Scorecards</h2>

        {/* Filter Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supplier IDs (comma-separated, leave empty for top 10)
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={supplierIds}
              onChange={(e) => setSupplierIds(e.target.value)}
              placeholder="e.g., 1,2,3"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleCompare}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              Compare
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Comparison Chart */}
      {comparisons.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}

      {/* Comparison Table */}
      {comparisons.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Detailed Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    On-Time Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparisons.map((comp) => (
                  <tr key={comp.supplier_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{comp.supplier_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{comp.health_score.toFixed(1)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          comp.is_healthy
                            ? 'bg-green-100 text-green-800'
                            : comp.is_critical
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {comp.health_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comp.on_time_delivery_pct.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comp.quality_performance_pct.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comp.lead_time_consistency_pct.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comp.payment_reliability_pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {comparisons.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No comparison data available.
        </div>
      )}
    </div>
  );
};

export default ScorecardComparison;
