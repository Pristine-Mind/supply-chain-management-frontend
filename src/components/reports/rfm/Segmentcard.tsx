import React from 'react';
import { SegmentSummary } from './rmf.type';
import { Users, TrendingUp } from 'lucide-react';

interface Props {
  summary: SegmentSummary;
  isSelected: boolean;
  onClick: () => void;
}

const SegmentCard: React.FC<Props> = ({ summary, isSelected, onClick }) => {
  const churnPct = Math.round(summary.avgChurnScore * 100);

  // Churn bar gradient colour
  const barColor =
    churnPct < 30 ? 'bg-emerald-500' :
    churnPct < 55 ? 'bg-amber-500' :
    churnPct < 70 ? 'bg-orange-500' : 'bg-rose-600';

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md
        ${isSelected
          ? `border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-300`
          : 'border-gray-200 bg-white hover:border-orange-300'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xl leading-none">{summary.emoji}</span>
          <h3 className="font-bold text-gray-800 text-sm mt-1">{summary.segment}</h3>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${summary.colorClass}`}>
          {summary.percentage}%
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <Users size={12} />
          <span className="font-semibold text-gray-700">{summary.count.toLocaleString()}</span> users
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <TrendingUp size={12} />
          <span className="font-semibold text-gray-700">${summary.avgRevenue.toLocaleString()}</span> avg
        </div>
      </div>

      {/* Churn bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Avg churn risk</span>
          <span className="font-bold text-gray-700">{churnPct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${churnPct}%` }}
          />
        </div>
      </div>

      {/* Campaign tag */}
      <p className="text-[10px] text-gray-400 truncate mt-2">
        📣 {summary.campaignType}
      </p>
    </button>
  );
};

export default SegmentCard;