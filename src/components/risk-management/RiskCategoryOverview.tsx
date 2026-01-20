import React, { useEffect, useState } from 'react';
import { getCurrentRiskAssessment, getRiskLevelColor } from '../../api/riskManagementApi';
import type { RiskCategory, RiskLevel } from '../../types/riskManagement';
import { Link } from 'react-router-dom';
import BackButton from '../BackButton';

const RiskCategoryOverview: React.FC = () => {
  const [riskAssessment, setRiskAssessment] = useState<RiskCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRiskAssessment();
  }, []);

  const loadRiskAssessment = async () => {
    try {
      setLoading(true);
      const data = await getCurrentRiskAssessment();
      console.log('Risk assessment data:', data);
      setRiskAssessment(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load risk assessment');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeClass = (level: RiskLevel) => {
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

  const getRiskScore = (level: RiskLevel) => {
    const scoreMap: Record<RiskLevel, string> = {
      low: '0-30',
      medium: '30-60',
      high: '60-80',
      critical: '80-100',
    };
    return scoreMap[level];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !riskAssessment) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error || 'No risk assessment available'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Risk Assessment</h2>
            <p className="text-gray-500 mt-1">
              {riskAssessment.supplier_name} • {new Date(riskAssessment.snapshot_date).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-amber-600">{riskAssessment.overall_risk_score.toFixed(1)}</div>
            <span
              className={`mt-2 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getRiskBadgeClass(
                riskAssessment.overall_risk_level
              )}`}
            >
              {riskAssessment.overall_risk_level_display}
            </span>
            <p className="text-xs text-gray-500 mt-2">Score Range: {getRiskScore(riskAssessment.overall_risk_level)}</p>
          </div>
        </div>
      </div>

      {/* Risk Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Supplier Risk */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-gray-800">Supplier Risk</h3>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadgeClass(
                riskAssessment.supplier_risk_level
              )}`}
            >
              {riskAssessment.supplier_risk_level_display}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">High Risk Suppliers</p>
              <p className="text-xl font-bold text-gray-900">{riskAssessment.supplier_high_risk_count}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Spend at Risk</p>
              <p className="text-xl font-bold text-red-600">
                Rs.{riskAssessment.supplier_spend_at_risk.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Single Source Dependencies</p>
              <p className="text-xl font-bold text-orange-600">{riskAssessment.single_source_dependencies}</p>
            </div>
          </div>
        </div>

        {/* Logistics Risk */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-gray-800">Logistics Risk</h3>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadgeClass(
                riskAssessment.logistics_risk_level
              )}`}
            >
              {riskAssessment.logistics_risk_level_display}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Active Shipment Delays</p>
              <p className="text-xl font-bold text-gray-900">{riskAssessment.active_shipment_delays}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Average Delay</p>
              <p className="text-xl font-bold text-red-600">{riskAssessment.avg_delay_days.toFixed(1)} days</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Routes with Issues</p>
              <p className="text-xl font-bold text-orange-600">{riskAssessment.routes_with_issues}</p>
            </div>
          </div>
        </div>

        {/* Demand Risk */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-gray-800">Demand Risk</h3>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadgeClass(
                riskAssessment.demand_risk_level
              )}`}
            >
              {riskAssessment.demand_risk_level_display}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Forecast Accuracy</p>
              <p className="text-xl font-bold text-gray-900">{riskAssessment.forecast_accuracy.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Volatile Products</p>
              <p className="text-xl font-bold text-orange-600">{riskAssessment.volatile_products_count}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Stockout Incidents</p>
              <p className="text-xl font-bold text-red-600">{riskAssessment.stockout_incidents}</p>
            </div>
          </div>
        </div>

        {/* Inventory Risk */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-gray-800">Inventory Risk</h3>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadgeClass(
                riskAssessment.inventory_risk_level
              )}`}
            >
              {riskAssessment.inventory_risk_level_display}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Below Safety Stock</p>
              <p className="text-xl font-bold text-red-600">{riskAssessment.items_below_safety_stock}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Overstock Items</p>
              <p className="text-xl font-bold text-orange-600">{riskAssessment.overstock_items_count}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Value at Risk</p>
              <p className="text-xl font-bold text-gray-900">
                Rs.{riskAssessment.total_inventory_value_at_risk.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(riskAssessment.last_updated).toLocaleString()}
      </div>
    </div>
  );
};

export default RiskCategoryOverview;
