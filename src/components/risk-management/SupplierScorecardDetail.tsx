import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getSupplierScorecard,
  getScorecardHistory,
  getHealthStatusColor,
} from '../../api/riskManagementApi';
import type { SupplierScorecard, ScorecardHistory } from '../../types/riskManagement';
import { Line } from 'react-chartjs-2';
import BackButton from '../BackButton';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SupplierScorecardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [scorecard, setScorecard] = useState<SupplierScorecard | null>(null);
  const [history, setHistory] = useState<ScorecardHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Route ID from params:', id);
    if (id && id !== 'comparison' && !isNaN(Number(id))) {
      loadScorecardData();
    } else if (!id || id === 'comparison' || isNaN(Number(id))) {
      setError(`Invalid scorecard ID: ${id}`);
      setLoading(false);
    }
  }, [id]);

  const loadScorecardData = async () => {
    try {
      setLoading(true);
      if (!id) {
        setError('No scorecard ID provided');
        setLoading(false);
        return;
      }
      
      const scorecardId = Number(id);
      console.log('Attempting to load scorecard ID:', scorecardId);
      
      if (isNaN(scorecardId)) {
        setError(`Invalid scorecard ID: ${id} cannot be converted to a number`);
        setLoading(false);
        return;
      }

      const [scorecardData, historyData] = await Promise.all([
        getSupplierScorecard(scorecardId),
        getScorecardHistory(scorecardId),
      ]);
      console.log('Scorecard data loaded:', scorecardData);
      setScorecard(scorecardData);
      setHistory(historyData);
      setError(null);
    } catch (err: any) {
      console.error('Error loading scorecard:', err);
      setError(err.response?.data?.detail || `Failed to load scorecard: ${err.message}`);
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

  if (error || !scorecard) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error || 'Scorecard not found'}
        </div>
        <Link to="/risk-management/scorecards" className="mt-4 inline-block text-indigo-600 hover:text-indigo-900">
          ← Back to Scorecards
        </Link>
      </div>
    );
  }

  const getHealthBadgeClass = () => {
    const color = getHealthStatusColor(scorecard.health_status);
    const colorMap: Record<string, string> = {
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colorMap[color] || colorMap.gray;
  };

  // Prepare chart data
  const chartData = {
    labels: history.map((h) => new Date(h.recorded_at).toLocaleDateString()).reverse(),
    datasets: [
      {
        label: 'Health Score',
        data: history.map((h) => h.health_score).reverse(),
        borderColor: 'rgb(217, 119, 6)',
        backgroundColor: 'rgba(217, 119, 6, 0.1)',
        tension: 0.4,
      },
      {
        label: 'On-Time Delivery %',
        data: history.map((h) => h.on_time_delivery_pct).reverse(),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Quality Performance %',
        data: history.map((h) => h.quality_performance_pct).reverse(),
        borderColor: 'rgb(217, 119, 6)',
        backgroundColor: 'rgba(217, 119, 6, 0.1)',
        tension: 0.4,
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
        text: '90-Day Performance History',
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
      {/* Header */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{scorecard.supplier_name}</h2>
            <p className="text-gray-500 mt-1">
              Last calculated: {new Date(scorecard.last_calculated).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-indigo-600">{scorecard.health_score.toFixed(1)}</div>
            <span className={`mt-2 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getHealthBadgeClass()}`}>
              {scorecard.health_status_display}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">On-Time Delivery</h3>
          <div className="text-2xl font-bold text-gray-900">{scorecard.on_time_delivery_pct.toFixed(1)}%</div>
          <p className="text-sm text-gray-500 mt-1">
            {scorecard.on_time_orders} / {scorecard.total_orders} orders
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Quality Performance</h3>
          <div className="text-2xl font-bold text-gray-900">{scorecard.quality_performance_pct.toFixed(1)}%</div>
          <p className="text-sm text-gray-500 mt-1">{scorecard.defect_count} defects</p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Lead Time Consistency</h3>
          <div className="text-2xl font-bold text-gray-900">{scorecard.lead_time_consistency_pct.toFixed(1)}%</div>
          <p className="text-sm text-gray-500 mt-1">
            Avg: {scorecard.avg_lead_time_days.toFixed(1)} days
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Reliability</h3>
          <div className="text-2xl font-bold text-gray-900">{scorecard.payment_reliability_pct.toFixed(1)}%</div>
          <p className="text-sm text-gray-500 mt-1">{scorecard.late_payments_count} late payments</p>
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Performance Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-lg font-semibold text-gray-900">{scorecard.total_orders}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">On-Time Orders</p>
            <p className="text-lg font-semibold text-gray-900">{scorecard.on_time_orders}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Lead Time</p>
            <p className="text-lg font-semibold text-gray-900">{scorecard.avg_lead_time_days.toFixed(1)} days</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Lead Time Variance</p>
            <p className="text-lg font-semibold text-gray-900">{scorecard.lead_time_variance.toFixed(2)} days</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Defect Count</p>
            <p className="text-lg font-semibold text-gray-900">{scorecard.defect_count}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Late Payments</p>
            <p className="text-lg font-semibold text-gray-900">{scorecard.late_payments_count}</p>
          </div>
        </div>
      </div>

      {/* Historical Chart */}
      {history.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default SupplierScorecardDetail;
