import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listSupplierScorecards,
  getHealthStatusColor,
} from '../../api/riskManagementApi';
import type {
  SupplierScorecard,
  ScorecardQueryParams,
  HealthStatus,
} from '../../types/riskManagement';
import BackButton from '../BackButton';

const SupplierScorecardList: React.FC = () => {
  const [scorecards, setScorecards] = useState<SupplierScorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ScorecardQueryParams>({
    page_size: 20,
    ordering: '-health_score',
  });

  useEffect(() => {
    loadScorecards();
  }, [page, filters]);

  const loadScorecards = async () => {
    try {
      setLoading(true);
      const response = await listSupplierScorecards({ ...filters, page });
      setScorecards(response.results);
      setTotalPages(Math.ceil(response.count / (filters.page_size || 20)));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load supplier scorecards');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ScorecardQueryParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const getHealthBadgeClass = (status: HealthStatus) => {
    const color = getHealthStatusColor(status);
    const colorMap: Record<string, string> = {
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colorMap[color] || colorMap.gray;
  };

  if (loading && scorecards.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div>
      <BackButton />
      <div className="bg-white shadow-md rounded-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Supplier Scorecards</h2>
          <Link
            to="/risk-management/scorecards/comparison"
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition"
          >
          Compare Suppliers
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Health Status
          </label>
          <select
            value={filters.health_status || ''}
            onChange={(e) => handleFilterChange('health_status', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="healthy">Healthy</option>
            <option value="monitor">Monitor</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supplier Name
          </label>
          <input
            type="text"
            value={filters.supplier__name || ''}
            onChange={(e) => handleFilterChange('supplier__name', e.target.value || undefined)}
            placeholder="Search by name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.ordering || '-health_score'}
            onChange={(e) => handleFilterChange('ordering', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="-health_score">Health Score (High to Low)</option>
            <option value="health_score">Health Score (Low to High)</option>
            <option value="supplier_name">Supplier Name (A-Z)</option>
            <option value="-supplier_name">Supplier Name (Z-A)</option>
            <option value="-updated_at">Recently Updated</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Scorecards Table */}
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
                Total Orders
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {scorecards.map((scorecard) => (
              <tr key={scorecard.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {scorecard.supplier_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">
                    {scorecard.health_score.toFixed(1)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getHealthBadgeClass(
                      scorecard.health_status
                    )}`}
                  >
                    {scorecard.health_status_display}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {scorecard.on_time_delivery_pct.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {scorecard.quality_performance_pct.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {scorecard.total_orders}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    to={`/risk-management/scorecards/${scorecard.supplier_id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {scorecards.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No supplier scorecards found.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default SupplierScorecardList;
