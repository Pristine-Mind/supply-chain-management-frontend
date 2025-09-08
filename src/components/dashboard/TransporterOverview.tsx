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
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-yellow-800">
          Welcome, {userLabel || 'Transporter'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">Your transporter dashboard overview</p>
      </div>

      <div className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow p-4 mb-6`}>
        {loading ? (
          <p className="text-gray-500">Loading stats...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <InfoCard icon={<DollarSign className="h-6 w-6 text-green-600 mr-3" />} title="Total Earnings" value={`Rs.${stats.total_earnings}`} darkMode={darkMode} />
            <InfoCard icon={<DollarSign className="h-6 w-6 text-yellow-600 mr-3" />} title="This Month" value={`Rs.${stats.earnings_this_month}`} darkMode={darkMode} />
            <InfoCard icon={<BarChart3 className="h-6 w-6 text-blue-600 mr-3" />} title="Active Deliveries" value={stats.active_deliveries} darkMode={darkMode} />
            <InfoCard icon={<BarChart3 className="h-6 w-6 text-purple-600 mr-3" />} title="Success Rate" value={`${Math.round(stats.success_rate * 100)}%`} darkMode={darkMode} />
          </div>
        ) : (
          <p className="text-gray-500">No stats available yet.</p>
        )}
        <div className="mt-4 flex justify-end">
          <a href="/earnings" className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">View full earnings →</a>
        </div>
      </div>

      <div className="text-gray-700">
        <p className="text-base md:text-lg">
          Use the menu to access your transporter features.
        </p>
      </div>
    </div>
  );
};

export default TransporterOverview;
