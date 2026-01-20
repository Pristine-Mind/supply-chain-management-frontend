import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listAlerts, acknowledgeAlert, resolveAlert, getAlertSeverityColor, getAlertTypeIcon } from '../../api/riskManagementApi';
import type { SupplyChainAlert, AlertStatus, AlertSeverity } from '../../types/riskManagement';
import BackButton from '../BackButton';

const AlertDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [alert, setAlert] = useState<SupplyChainAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAlert();
  }, [id]);

  const loadAlert = async () => {
    try {
      setLoading(true);
      if (!id) {
        setError('Invalid alert ID');
        setLoading(false);
        return;
      }

      console.log('Loading alert with alert_id:', id);
      const response = await listAlerts({ page_size: 1000 });
      console.log('All alerts response:', response);
      const foundAlert = response.results.find((a) => a.alert_id === id);
      
      console.log('Found alert:', foundAlert);
      
      if (!foundAlert) {
        setError('Alert not found');
        setLoading(false);
        return;
      }

      setAlert(foundAlert);
      setError(null);
    } catch (err: any) {
      console.error('Load alert error:', err);
      setError(err.response?.data?.detail || 'Failed to load alert details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!alert?.alert_id) {
      console.error('No alert ID available for API call', alert);
      alert('Cannot process alert - missing ID');
      return;
    }
    try {
      setProcessing(true);
      console.log('Acknowledging alert with ID:', alert.alert_id);
      const updated = await acknowledgeAlert(alert.alert_id);
      setAlert(updated);
    } catch (err: any) {
      console.error('Acknowledge error:', err);
      alert(err.response?.data?.detail || 'Failed to acknowledge alert');
    } finally {
      setProcessing(false);
    }
  };

  const handleResolve = async () => {
    if (!alert?.alert_id) {
      console.error('No alert ID available for API call', alert);
      alert('Cannot process alert - missing ID');
      return;
    }
    try {
      setProcessing(true);
      console.log('Resolving alert with ID:', alert.alert_id);
      const updated = await resolveAlert(alert.alert_id);
      setAlert(updated);
    } catch (err: any) {
      console.error('Resolve error:', err);
      alert(err.response?.data?.detail || 'Failed to resolve alert');
    } finally {
      setProcessing(false);
    }
  };

  const getSeverityBadgeClass = (severity: AlertSeverity) => {
    const color = getAlertSeverityColor(severity);
    const colorMap: Record<string, string> = {
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-amber-100 text-amber-800',
      blue: 'bg-blue-100 text-blue-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colorMap[color] || colorMap.gray;
  };

  const getStatusBadgeClass = (status: AlertStatus) => {
    const statusMap: Record<AlertStatus, string> = {
      active: 'bg-red-100 text-red-800',
      acknowledged: 'bg-amber-100 text-amber-800',
      resolved: 'bg-green-100 text-green-800',
      auto_resolved: 'bg-gray-100 text-gray-800',
    };
    return statusMap[status] || statusMap.active;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="space-y-6">
        <BackButton />
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error || 'Alert not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />

      <div className="bg-white shadow-md rounded-lg p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-5xl">{getAlertTypeIcon(alert.alert_type)}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{alert.title}</h1>
              <p className="text-gray-500 mt-1">{alert.alert_type_display}</p>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <span className={`px-4 py-2 text-sm font-semibold rounded-lg text-center ${getSeverityBadgeClass(alert.severity)}`}>
              {alert.severity_display}
            </span>
            <span className={`px-4 py-2 text-sm font-semibold rounded-lg text-center ${getStatusBadgeClass(alert.status)}`}>
              {alert.status_display}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Description</h2>
          <p className="text-gray-700 text-lg mb-8">{alert.description}</p>

          <h2 className="text-xl font-bold text-gray-800 mb-4">Alert Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">Alert ID</p>
              <p className="text-lg font-semibold text-gray-900">{alert.alert_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Triggered At</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(alert.triggered_at).toLocaleString()}
              </p>
            </div>
            {alert.supplier_name && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Supplier</p>
                <p className="text-lg font-semibold text-gray-900">{alert.supplier_name}</p>
              </div>
            )}
            {alert.product_name && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Product</p>
                <p className="text-lg font-semibold text-gray-900">{alert.product_name}</p>
              </div>
            )}
            {alert.metric_value !== null && alert.threshold_value !== null && (
              <>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Metric Value</p>
                  <p className="text-lg font-semibold text-gray-900">{alert.metric_value.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Threshold Value</p>
                  <p className="text-lg font-semibold text-gray-900">{alert.threshold_value.toFixed(2)}</p>
                </div>
              </>
            )}
            {alert.acknowledged_at && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Acknowledged At</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(alert.acknowledged_at).toLocaleString()}
                </p>
              </div>
            )}
            {alert.resolved_at && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Resolved At</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(alert.resolved_at).toLocaleString()}
                </p>
              </div>
            )}
            {alert.assigned_to_username && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Assigned To</p>
                <p className="text-lg font-semibold text-gray-900">{alert.assigned_to_username}</p>
              </div>
            )}
          </div>

          {alert.notification_channels && alert.notification_channels.length > 0 && (
            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-2">Notification Channels</p>
              <div className="flex flex-wrap gap-2">
                {alert.notification_channels.map((channel) => (
                  <span key={channel} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {channel}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6 flex space-x-4">
          {alert.status === 'active' && (
            <button
              onClick={handleAcknowledge}
              disabled={processing}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition font-semibold"
            >
              {processing ? 'Processing...' : 'Acknowledge Alert'}
            </button>
          )}
          {(alert.status === 'active' || alert.status === 'acknowledged') && (
            <button
              onClick={handleResolve}
              disabled={processing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-semibold"
            >
              {processing ? 'Processing...' : 'Resolve Alert'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertDetailPage;
