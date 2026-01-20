import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listAlerts,
  acknowledgeAlert,
  resolveAlert,
  getAlertSeverityColor,
  getAlertTypeIcon,
} from '../../api/riskManagementApi';
import type {
  SupplyChainAlert,
  AlertQueryParams,
  AlertSeverity,
  AlertStatus,
  AlertType,
} from '../../types/riskManagement';
import BackButton from '../BackButton';

const SupplyChainAlertsList: React.FC = () => {
  const [alerts, setAlerts] = useState<SupplyChainAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<AlertQueryParams>({
    page_size: 20,
    ordering: '-triggered_at',
  });
  const [processingAlert, setProcessingAlert] = useState<number | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [page, filters]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await listAlerts({ ...filters, page });
      setAlerts(response.results);
      setTotalPages(Math.ceil(response.count / (filters.page_size || 20)));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: number) => {
    try {
      setProcessingAlert(id);
      const updated = await acknowledgeAlert(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to acknowledge alert');
    } finally {
      setProcessingAlert(null);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      setProcessingAlert(id);
      const updated = await resolveAlert(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to resolve alert');
    } finally {
      setProcessingAlert(null);
    }
  };

  const handleFilterChange = (key: keyof AlertQueryParams, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const getSeverityBadgeClass = (severity: AlertSeverity) => {
    const color = getAlertSeverityColor(severity);
    const colorMap: Record<string, string> = {
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colorMap[color] || colorMap.gray;
  };

  const getStatusBadgeClass = (status: AlertStatus) => {
    const statusMap: Record<AlertStatus, string> = {
      active: 'bg-red-100 text-red-800',
      acknowledged: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      auto_resolved: 'bg-gray-100 text-gray-800',
    };
    return statusMap[status] || statusMap.active;
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Supply Chain Alerts</h2>
          <Link
            to="/risk-management/alerts/statistics"
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition"
          >
          View Statistics
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
          <select
            value={filters.severity || ''}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="auto_resolved">Auto Resolved</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            value={filters.alert_type || ''}
            onChange={(e) => handleFilterChange('alert_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="otif_violation">OTIF Violation</option>
            <option value="quality_issue">Quality Issue</option>
            <option value="delivery_delay">Delivery Delay</option>
            <option value="inventory_low">Inventory Low</option>
            <option value="supplier_risk">Supplier Risk</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search alerts..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{getAlertTypeIcon(alert.alert_type)}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityBadgeClass(alert.severity)}`}>
                    {alert.severity_display}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(alert.status)}`}>
                    {alert.status_display}
                  </span>
                </div>

                <p className="text-gray-600 mb-3">{alert.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {alert.supplier_name && (
                    <div>
                      <p className="text-gray-500">Supplier</p>
                      <p className="font-medium text-gray-900">{alert.supplier_name}</p>
                    </div>
                  )}
                  {alert.metric_value !== null && alert.threshold_value !== null && (
                    <div>
                      <p className="text-gray-500">Metric Value</p>
                      <p className="font-medium text-gray-900">
                        {alert.metric_value.toFixed(1)} / {alert.threshold_value.toFixed(1)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Triggered At</p>
                    <p className="font-medium text-gray-900">
                      {new Date(alert.triggered_at).toLocaleString()}
                    </p>
                  </div>
                  {alert.assigned_to_username && (
                    <div>
                      <p className="text-gray-500">Assigned To</p>
                      <p className="font-medium text-gray-900">{alert.assigned_to_username}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-4 flex flex-col space-y-2">
                {alert.status === 'active' && (
                  <button
                    onClick={() => handleAcknowledge(alert.id!)}
                    disabled={processingAlert === alert.id}
                    className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 disabled:opacity-50 transition"
                  >
                    {processingAlert === alert.id ? 'Processing...' : 'Acknowledge'}
                  </button>
                )}
                {(alert.status === 'active' || alert.status === 'acknowledged') && (
                  <button
                    onClick={() => handleResolve(alert.id!)}
                    disabled={processingAlert === alert.id}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {processingAlert === alert.id ? 'Processing...' : 'Resolve'}
                  </button>
                )}
                <Link
                  to={`/risk-management/alerts/${alert.alert_id}`}
                  className="px-3 py-1 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700 text-center transition"
                >
                  Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {alerts.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">No alerts found.</div>
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

export default SupplyChainAlertsList;
