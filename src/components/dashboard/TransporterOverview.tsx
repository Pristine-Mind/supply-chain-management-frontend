import React from 'react';
import { DollarSign, BarChart3 } from 'lucide-react';
import type { TransporterStats } from '../../api/transporterApi';
import { InfoCard } from './InfoBlocks';

interface Props {
  userLabel?: string | null;
  darkMode?: boolean;
  stats: TransporterStats | null;
  loading: boolean;
  error: string | null;
}

const TransporterOverview: React.FC<Props> = ({ userLabel, darkMode, stats, loading, error }) => {
  return (
    <div className="h-full">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-neutral-900">
          Welcome, {userLabel || 'Transporter'}
        </h1>
        <p className="text-body text-neutral-600 mt-2">Your transporter dashboard overview</p>
      </div>

      <div className={`rounded-lg shadow-elevation-lg border p-6 mb-8 ${
        darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
      }`}>
        {loading ? (
          <p className="text-neutral-500">Loading stats...</p>
        ) : error ? (
          <p className="text-accent-error-600">{error}</p>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <InfoCard icon={<DollarSign className="h-6 w-6 text-accent-success-600 mr-3" />} title="Total Earnings" value={`Rs.${stats.total_earnings}`} darkMode={darkMode} />
            <InfoCard icon={<DollarSign className="h-6 w-6 text-accent-warning-600 mr-3" />} title="This Month" value={`Rs.${stats.earnings_this_month}`} darkMode={darkMode} />
            <InfoCard icon={<BarChart3 className="h-6 w-6 text-accent-info-600 mr-3" />} title="Active Deliveries" value={stats.active_deliveries} darkMode={darkMode} />
            <InfoCard icon={<BarChart3 className="h-6 w-6 text-primary-600 mr-3" />} title="Success Rate" value={`${Math.round(stats.success_rate * 100)}%`} darkMode={darkMode} />
          </div>
        ) : (
          <p className="text-neutral-500">No stats available yet.</p>
        )}
        <div className="mt-6 flex justify-end">
          <a href="/earnings" className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-elevation-md">
            View full earnings →
          </a>
        </div>
      </div>

      <div className="text-neutral-700">
        <p className="text-body">
          Use the menu to access your transporter features.
        </p>
      </div>
    </div>
  );
};

export default TransporterOverview;
