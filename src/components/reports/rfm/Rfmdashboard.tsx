// ─────────────────────────────────────────────────────────────────────────────
// RFMDashboard.tsx  — UPDATED after Step 3 + Step 4
// Wires in: RFMHeatmapGrid, SegmentTable
// Remaining placeholders: CampaignMatrix (Step 5), TriggerLogPanel (Step 8)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react';
import {
  Users, TrendingUp, AlertTriangle, Zap,
  RefreshCw, Activity, LayoutGrid, Target, Radio,
} from 'lucide-react';

import { SegmentName, Customer } from './rfm.types';
import { DUMMY_CUSTOMERS, SEGMENT_SUMMARIES, DUMMY_TRIGGERS } from './rfm.data';

// ── Real components ───────────────────────────────────────────────────────────
import RFMHeatmapGrid from './RFMHeatmapGrid';    // Step 3 ✅
import SegmentTable   from './SegmentTable';       // Step 4 ✅

// ── Placeholders — replace as each step is built ─────────────────────────────
const CampaignMatrixPlaceholder = () => (
  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center h-64">
    <p className="text-sm text-gray-400 font-medium">⬜ CampaignMatrix — Step 5</p>
  </div>
);
const TriggerLogPanelPlaceholder = () => (
  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center h-64">
    <p className="text-sm text-gray-400 font-medium">⬜ TriggerLogPanel — Step 8</p>
  </div>
);

// ── Step 7 placeholder: swap with real ShapExplainerPanel when built ──────────
const ShapDrawerPlaceholder: React.FC<{
  customer: Customer | null; onClose: () => void;
}> = ({ customer, onClose }) => {
  if (!customer) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-96 bg-white shadow-2xl flex items-center justify-center">
        <p className="text-sm text-gray-400">⬜ ShapExplainerPanel — Step 7</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────────────────────────
interface KPICardProps {
  label: string; value: string; sub: string;
  icon: React.ReactNode; iconBg: string;
  trend?: { value: string; up: boolean };
}

const KPICard: React.FC<KPICardProps> = ({ label, value, sub, icon, iconBg, trend }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconBg}`}>{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs text-gray-400">{sub}</p>
        {trend && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            trend.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Segment Filter Card
// ─────────────────────────────────────────────────────────────────────────────
interface SegmentFilterCardProps {
  segment: SegmentName; emoji: string; count: number; percentage: number;
  avgChurnScore: number; colorClass: string; ringClass: string;
  textClass: string; bgClass: string; isSelected: boolean; onClick: () => void;
}

const SegmentFilterCard: React.FC<SegmentFilterCardProps> = ({
  segment, emoji, count, percentage, avgChurnScore,
  colorClass, ringClass, textClass, bgClass, isSelected, onClick,
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 cursor-pointer
      ${isSelected
        ? `${bgClass} border-current ring-2 ${ringClass} shadow-md scale-[1.02]`
        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm hover:scale-[1.01]'}`}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-xl">{emoji}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${bgClass} ${textClass}`}>
        {percentage}%
      </span>
    </div>
    <p className={`text-sm font-bold mb-1 ${isSelected ? textClass : 'text-gray-800'}`}>{segment}</p>
    <p className="text-xl font-bold text-gray-900 leading-tight">{count.toLocaleString()}</p>
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-400 font-medium">Avg churn</span>
        <span className={`text-[10px] font-bold ${textClass}`}>
          {Math.round(avgChurnScore * 100)}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass} transition-all duration-500`}
          style={{ width: `${avgChurnScore * 100}%` }} />
      </div>
    </div>
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Tab Button
// ─────────────────────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'matrix' | 'triggers';

const TabButton: React.FC<{
  tabKey: TabKey; label: string; icon: React.ReactNode;
  activeTab: TabKey; badge?: number; onClick: (k: TabKey) => void;
}> = ({ tabKey, label, icon, activeTab, badge, onClick }) => (
  <button
    onClick={() => onClick(tabKey)}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl
      transition-all duration-150 relative
      ${activeTab === tabKey
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'}`}
  >
    {icon}{label}
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────
const RFMDashboard: React.FC = () => {
  const [selectedSegment,  setSelectedSegment ] = useState<SegmentName | 'All'>('All');
  const [activeTab,        setActiveTab       ] = useState<TabKey>('overview');
  const [lastRefreshed,    setLastRefreshed   ] = useState('Today, 08:00 AM');
  const [isRefreshing,     setIsRefreshing    ] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null); // Step 7

  const kpis = useMemo(() => {
    let criticalCount = 0, churnSum = 0, totalRevenue = 0, clvSum = 0;
    for (const c of DUMMY_CUSTOMERS) {
      if (c.churnRisk === 'Critical') criticalCount++;
      churnSum += c.churnScore; totalRevenue += c.totalRevenue; clvSum += c.clv90Day;
    }
    return { totalCustomers: DUMMY_CUSTOMERS.length, criticalCount, avgChurn: churnSum / DUMMY_CUSTOMERS.length, totalRevenue, totalClv90: clvSum };
  }, []);

  const pendingTriggers = useMemo(() => DUMMY_TRIGGERS.filter(t => t.status === 'pending').length, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshed(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    }, 900);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1 tracking-wide uppercase">Admin · Analytics</p>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">RFM Customer Intelligence</h1>
            <p className="text-sm text-gray-500 mt-1">Recency · Frequency · Monetary — powered by XGBoost churn scoring</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <Activity size={12} className="text-emerald-500" />
              Updated: {lastRefreshed}
            </div>
            <button onClick={handleRefresh} disabled={isRefreshing}
              className="flex items-center gap-2 text-sm font-semibold bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white rounded-xl px-4 py-2 transition-colors shadow-sm">
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Customers" value={kpis.totalCustomers.toLocaleString()}          sub="Across all segments"     icon={<Users         size={18} className="text-blue-600"    />} iconBg="bg-blue-50"    trend={{ value: '+3.2% MoM',           up: true  }} />
          <KPICard label="Avg Churn Score" value={`${Math.round(kpis.avgChurn * 100)}%`}         sub="Platform-wide risk"      icon={<TrendingUp    size={18} className="text-orange-500"  />} iconBg="bg-orange-50"  trend={{ value: '2.1% WoW',            up: false }} />
          <KPICard label="Critical Risk"   value={kpis.criticalCount.toString()}                 sub="Need immediate action"   icon={<AlertTriangle size={18} className="text-rose-600"    />} iconBg="bg-rose-50"    trend={{ value: `${pendingTriggers} pending`, up: false }} />
          <KPICard label="CLV 90-Day"      value={`₹${(kpis.totalClv90 / 1000).toFixed(0)}K`}   sub="Predicted total revenue" icon={<Zap           size={18} className="text-emerald-600" />} iconBg="bg-emerald-50" trend={{ value: '+8.4% vs last qtr',    up: true  }} />
        </div>

        {/* Segment Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">Customer Segments</h2>
              <p className="text-xs text-gray-400 mt-0.5">Click a segment to filter the view below</p>
            </div>
            {selectedSegment !== 'All' && (
              <button onClick={() => setSelectedSegment('All')}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
                ✕ Clear filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {SEGMENT_SUMMARIES.map(s => (
              <SegmentFilterCard key={s.segment} {...s}
                isSelected={selectedSegment === s.segment}
                onClick={() => setSelectedSegment(prev => prev === s.segment ? 'All' : s.segment)}
              />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1.5 w-fit mb-6">
            <TabButton tabKey="overview" label="Overview"        icon={<LayoutGrid size={14} />} activeTab={activeTab} onClick={setActiveTab} />
            <TabButton tabKey="matrix"   label="Campaign Matrix" icon={<Target     size={14} />} activeTab={activeTab} onClick={setActiveTab} />
            <TabButton tabKey="triggers" label="Live Triggers"   icon={<Radio      size={14} />} activeTab={activeTab} badge={pendingTriggers} onClick={setActiveTab} />
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Segment context banner */}
              {selectedSegment !== 'All' && (() => {
                const s = SEGMENT_SUMMARIES.find(x => x.segment === selectedSegment)!;
                return (
                  <div className={`${s.bgClass} border ${s.ringClass} rounded-2xl px-5 py-3 flex items-center gap-4 flex-wrap`}>
                    <span className="text-lg">{s.emoji}</span>
                    <div>
                      <span className={`text-sm font-bold ${s.textClass}`}>Viewing: {selectedSegment}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {s.count} customers · {Math.round(s.avgChurnScore * 100)}% avg churn · ₹{s.avgRevenue.toLocaleString()} avg revenue
                      </span>
                    </div>
                    <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${s.bgClass} ${s.textClass} border border-current/20`}>
                      {s.campaignType}
                    </span>
                  </div>
                );
              })()}

              {/* Heatmap ✅ */}
              <RFMHeatmapGrid selectedSegment={selectedSegment} />

              {/* Table ✅ — row click opens SHAP drawer (Step 7) */}
              <SegmentTable
                customers={DUMMY_CUSTOMERS}
                selectedSegment={selectedSegment}
                onCustomerClick={c => setSelectedCustomer(c)}
              />
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 flex items-start gap-3">
                <Target size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Segment × Churn Risk Decision Matrix</p>
                  <p className="text-xs text-blue-600 mt-0.5">Each cell defines the recommended campaign action, channel mix, discount depth, and urgency level.</p>
                </div>
              </div>
              <CampaignMatrixPlaceholder />
            </div>
          )}

          {activeTab === 'triggers' && (
            <div className="space-y-6">
              <div className="bg-rose-50 border border-rose-100 rounded-2xl px-5 py-3 flex items-start gap-3">
                <Radio size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-rose-800">Real-Time Trigger Feed</p>
                  <p className="text-xs text-rose-600 mt-0.5">Events fired by Apache Flink + Redis: cart abandonment, score crossings, segment downgrades, email inactivity.</p>
                </div>
              </div>
              <TriggerLogPanelPlaceholder />
            </div>
          )}
        </div>
      </div>

      {/* SHAP Drawer — Step 7 ready, placeholder until then */}
      <ShapDrawerPlaceholder
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
};

export default RFMDashboard;