import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRiskDrillDowns } from '../../api/riskManagementApi';
import type { RiskDrillDown } from '../../types/riskManagement';
import BackButton from '../BackButton';

const RiskDrillDownsPage: React.FC = () => {
  const [drillDowns, setDrillDowns] = useState<RiskDrillDown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDrillDowns();
  }, []);

  const loadDrillDowns = async () => {
    try {
      setLoading(true);
      console.log('Loading current drill-downs...');
      
      const response = await getRiskDrillDowns();
      console.log('Drill-downs loaded:', response);
      setDrillDowns(response.results);
      setError(null);
    } catch (err: any) {
      console.error('Error loading drill-downs:', err);
      setError(err.response?.data?.detail || `Failed to load drill-down details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      high_risk: 'bg-red-100 text-red-800',
      medium_risk: 'bg-yellow-100 text-yellow-800',
      low_risk: 'bg-green-100 text-green-800',
      normal: 'bg-gray-100 text-gray-800',
    };
    return statusMap[status] || statusMap.normal;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>
        <Link to="/risk-management/risks" className="mt-4 inline-block text-indigo-600 hover:text-indigo-900">
          ← Back to Risk Overview
        </Link>
      </div>
    );
  }

  // Group drill-downs by risk type
  const groupedDrillDowns = drillDowns.reduce((acc, dd) => {
    if (!acc[dd.risk_type]) {
      acc[dd.risk_type] = [];
    }
    acc[dd.risk_type].push(dd);
    return acc;
  }, {} as Record<string, RiskDrillDown[]>);

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800">Risk Drill-Down Details</h2>
        <p className="text-gray-500 mt-1">Detailed breakdown of identified risks</p>
      </div>

      {Object.keys(groupedDrillDowns).length === 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 text-center text-gray-500">
          No drill-down details available.
        </div>
      )}

      {Object.entries(groupedDrillDowns).map(([riskType, items]) => (
        <div key={riskType} className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {items[0]?.risk_type_display || riskType}
          </h3>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{item.item_name}</h4>
                    <p className="text-sm text-gray-500">{item.item_type_display}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(item.status)}`}
                  >
                    {item.status_display}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Metric Value</p>
                    <p className="text-lg font-bold text-gray-900">{item.metric_value.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Threshold</p>
                    <p className="text-lg font-bold text-gray-900">{item.threshold.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Variance</p>
                    <p
                      className={`text-lg font-bold ${
                        item.metric_value > item.threshold ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {(item.metric_value - item.threshold).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Additional Details */}
                {item.details && Object.keys(item.details).length > 0 && (
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Additional Details:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(item.details).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                          <span className="font-semibold text-gray-900">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-3">
                  Last updated: {new Date(item.updated_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RiskDrillDownsPage;
