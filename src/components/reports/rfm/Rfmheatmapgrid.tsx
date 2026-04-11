// ─────────────────────────────────────────────────────────────────────────────
// RFMHeatmapGrid.tsx
// 5×5 Recency × Frequency heatmap — the core visual of the RFM dashboard.
// always renders exactly 25 cells regardless of user count.

// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo, useState, useCallback } from 'react';
import { SegmentName } from './rmf.type';
import {  CAMPAIGN_MATRIX } from './Rfm.data';
import { X, TrendingUp, Users, DollarSign, Zap } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Segment mapping per R×F cell
// Based on standard RFM rules from spec Section 4.1
// ─────────────────────────────────────────────────────────────────────────────

interface CellSegmentInfo {
  name: string;           // display name (can be granular like "Potential Loyalist")
  segment: SegmentName;   // maps back to the 5 core segments
  hex: string;            // color for the cell
}

const CELL_SEGMENT_MAP: Record<string, CellSegmentInfo> = {
  '5-5': { name: 'Champions',         segment: 'Champion',  hex: '#f59e0b' },
  '5-4': { name: 'Champions',         segment: 'Champion',  hex: '#f59e0b' },
  '4-5': { name: 'Champions',         segment: 'Champion',  hex: '#f59e0b' },
  '4-4': { name: 'Loyal Customers',   segment: 'Loyal',     hex: '#10b981' },
  '5-3': { name: 'Potential Loyalist',segment: 'Potential', hex: '#3b82f6' },
  '4-3': { name: 'Potential Loyalist',segment: 'Potential', hex: '#3b82f6' },
  '3-5': { name: 'Loyal Customers',   segment: 'Loyal',     hex: '#10b981' },
  '3-4': { name: 'Loyal Customers',   segment: 'Loyal',     hex: '#10b981' },
  '5-2': { name: 'New Customers',     segment: 'Potential', hex: '#06b6d4' },
  '5-1': { name: 'New Customers',     segment: 'Potential', hex: '#06b6d4' },
  '4-2': { name: 'Promising',         segment: 'Potential', hex: '#8b5cf6' },
  '4-1': { name: 'Promising',         segment: 'Potential', hex: '#8b5cf6' },
  '3-3': { name: 'Need Attention',    segment: 'At Risk',   hex: '#f97316' },
  '3-2': { name: 'Need Attention',    segment: 'At Risk',   hex: '#f97316' },
  '3-1': { name: 'About to Sleep',    segment: 'At Risk',   hex: '#ef4444' },
  '2-5': { name: "Can't Lose Them",   segment: 'At Risk',   hex: '#ef4444' },
  '2-4': { name: "Can't Lose Them",   segment: 'At Risk',   hex: '#ef4444' },
  '1-5': { name: "Can't Lose Them",   segment: 'At Risk',   hex: '#ef4444' },
  '1-4': { name: "Can't Lose Them",   segment: 'At Risk',   hex: '#ef4444' },
  '2-3': { name: 'At Risk',           segment: 'At Risk',   hex: '#dc2626' },
  '2-2': { name: 'At Risk',           segment: 'At Risk',   hex: '#dc2626' },
  '1-3': { name: 'At Risk',           segment: 'At Risk',   hex: '#dc2626' },
  '2-1': { name: 'Hibernating',       segment: 'Dormant',   hex: '#6b7280' },
  '1-2': { name: 'Hibernating',       segment: 'Dormant',   hex: '#6b7280' },
  '1-1': { name: 'Lost',             segment: 'Dormant',   hex: '#374151' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Grid data — aggregated from DUMMY_CUSTOMERS

// ─────────────────────────────────────────────────────────────────────────────

// Realistic user count distribution for a 100k-scale platform
const SCALE_USER_COUNTS: Record<string, number> = {
  '5-5': 847,  '5-4': 1203, '5-3': 2341, '5-2': 892,  '5-1': 445,
  '4-5': 1567, '4-4': 3892, '4-3': 2108, '4-2': 1456, '4-1': 678,
  '3-5': 543,  '3-4': 1876, '3-3': 4231, '3-2': 2987, '3-1': 1123,
  '2-5': 234,  '2-4': 678,  '2-3': 1987, '2-2': 3456, '2-1': 2109,
  '1-5': 123,  '1-4': 345,  '1-3': 876,  '1-2': 2341, '1-1': 5678,
};

const SCALE_AVG_ORDER: Record<string, number> = {
  '5-5': 342, '5-4': 287, '5-3': 198, '5-2': 145, '5-1': 89,
  '4-5': 312, '4-4': 256, '4-3': 187, '4-2': 134, '4-1': 78,
  '3-5': 289, '3-4': 234, '3-3': 156, '3-2': 112, '3-1': 67,
  '2-5': 267, '2-4': 198, '2-3': 134, '2-2': 89,  '2-1': 45,
  '1-5': 234, '1-4': 178, '1-3': 112, '1-2': 67,  '1-1': 34,
};

// Trend data (vs last month) — replace with real delta from API
const TREND_DATA: Record<string, { delta: number }> = {
  '5-5': { delta: 12 }, '5-4': { delta: 8 },  '5-3': { delta: -3 }, '5-2': { delta: 5 },  '5-1': { delta: 2 },
  '4-5': { delta: 6 },  '4-4': { delta: -2 }, '4-3': { delta: 4 },  '4-2': { delta: -1 }, '4-1': { delta: 3 },
  '3-5': { delta: -5 }, '3-4': { delta: 1 },  '3-3': { delta: 9 },  '3-2': { delta: 7 },  '3-1': { delta: -4 },
  '2-5': { delta: -8 }, '2-4': { delta: -3 }, '2-3': { delta: 11 }, '2-2': { delta: 14 }, '2-1': { delta: 6 },
  '1-5': { delta: -2 }, '1-4': { delta: -6 }, '1-3': { delta: 3 },  '1-2': { delta: 8 },  '1-1': { delta: 15 },
};

type ViewMode = 'users' | 'revenue' | 'aov';

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip
// ─────────────────────────────────────────────────────────────────────────────

interface TooltipData { r: number; f: number; x: number; y: number }

const CellTooltip: React.FC<{ data: TooltipData }> = ({ data }) => {
  const key = `${data.r}-${data.f}`;
  const seg = CELL_SEGMENT_MAP[key];
  const users = SCALE_USER_COUNTS[key] ?? 0;
  const aov = SCALE_AVG_ORDER[key] ?? 0;
  const revenue = users * aov;
  const trend = TREND_DATA[key];

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: data.x + 14, top: data.y - 10 }}
    >
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-4 w-52 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg?.hex }} />
          <span className="text-white font-bold text-sm">{seg?.name ?? 'Unknown'}</span>
        </div>

        {/* R / F scores */}
        <div className="flex gap-2 mb-3">
          <span className="text-[10px] bg-white/10 text-gray-300 rounded-lg px-2 py-1 font-semibold">
            R Score: {data.r}
          </span>
          <span className="text-[10px] bg-white/10 text-gray-300 rounded-lg px-2 py-1 font-semibold">
            F Score: {data.f}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Users',      users.toLocaleString()],
            ['Avg Order',  `₹${aov}`],
            ['Est. Rev',   `₹${(revenue / 1000).toFixed(0)}k`],
            ['% of Base',  `${((users / 47456) * 100).toFixed(1)}%`],
          ].map(([label, val]) => (
            <div key={label} className="bg-white/5 rounded-lg p-2">
              <p className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-white font-bold text-xs mt-0.5">{val}</p>
            </div>
          ))}
        </div>

        {/* Trend */}
        {trend && (
          <div className={`mt-2 text-center text-[10px] font-bold rounded-lg py-1 ${
            trend.delta > 0
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}>
            {trend.delta > 0 ? '↑' : '↓'} {Math.abs(trend.delta)}% vs last month
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Drill-down panel (shown when a cell is clicked)
// ─────────────────────────────────────────────────────────────────────────────

interface DrillDownPanelProps {
  r: number;
  f: number;
  onClose: () => void;
}

const DrillDownPanel: React.FC<DrillDownPanelProps> = ({ r, f, onClose }) => {
  const key = `${r}-${f}`;
  const seg = CELL_SEGMENT_MAP[key];
  const users = SCALE_USER_COUNTS[key] ?? 0;
  const aov = SCALE_AVG_ORDER[key] ?? 0;
  const revenue = users * aov;
  const trend = TREND_DATA[key];

  // Find matching campaign matrix rows for this segment
  const campaigns = CAMPAIGN_MATRIX.filter(c => c.segment === seg?.segment);

  const CAMPAIGN_ACTIONS: Record<string, string[]> = {
    Champion:  ['VIP early access email', 'Referral reward push', 'Premium upsell flow'],
    Loyal:     ['Loyalty points reminder', 'Bundle offer email', 'Review request SMS'],
    Potential: ['Second-purchase discount', 'Personalized rec email', 'App download push'],
    'At Risk': ['30% off flash offer', 'Cart recovery SMS', 'Feedback + incentive'],
    Dormant:   ['Final offer email', 'Unsubscribe survey', 'Suppress from paid ads'],
  };

  const actions = seg ? (CAMPAIGN_ACTIONS[seg.segment] ?? []) : [];

  return (
    <div
      className="mt-4 rounded-2xl border p-5 transition-all duration-300"
      style={{
        borderColor: `${seg?.hex}30`,
        background: `${seg?.hex}06`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: seg?.hex }}
          />
          <div>
            <span className="font-bold text-gray-900 text-sm">{seg?.name}</span>
            <span className="text-gray-400 text-sm ml-2">R{r} · F{f}</span>
          </div>
          {trend && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              trend.delta > 0
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}>
              {trend.delta > 0 ? '↑' : '↓'} {Math.abs(trend.delta)}% MoM
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
        >
          <X size={16} />
        </button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { icon: <Users size={14} />,      label: 'Users',       value: users.toLocaleString(),             bg: 'bg-blue-50',    text: 'text-blue-600'    },
          { icon: <DollarSign size={14} />, label: 'Avg Order',   value: `₹${aov}`,                          bg: 'bg-amber-50',   text: 'text-amber-600'   },
          { icon: <TrendingUp size={14} />, label: 'Est. Revenue',value: `₹${(revenue / 1000).toFixed(0)}k`, bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { icon: <Zap size={14} />,        label: '% of Base',   value: `${((users / 47456) * 100).toFixed(1)}%`, bg: 'bg-purple-50', text: 'text-purple-600' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <div className={`flex items-center gap-1.5 ${m.text} mb-1`}>
              {m.icon}
              <span className="text-[10px] font-semibold uppercase tracking-wide">{m.label}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Recommended actions */}
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Recommended Campaigns
        </p>
        <div className="flex flex-wrap gap-2">
          {actions.map(a => (
            <span
              key={a}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border cursor-pointer hover:shadow-sm transition-shadow"
              style={{ borderColor: `${seg?.hex}40`, color: seg?.hex }}
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Campaign matrix match */}
      {campaigns.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Campaign Matrix Rules
          </p>
          <div className="space-y-1.5">
            {campaigns.slice(0, 3).map(c => (
              <div
                key={`${c.churnRisk}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-3 py-2 text-xs"
              >
                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                  c.churnRisk === 'Critical' ? 'bg-rose-50 text-rose-600' :
                  c.churnRisk === 'High'     ? 'bg-orange-50 text-orange-600' :
                  c.churnRisk === 'Medium'   ? 'bg-amber-50 text-amber-600' :
                                               'bg-gray-50 text-gray-500'
                }`}>
                  {c.churnRisk}
                </span>
                <span className="text-gray-700 flex-1">{c.action}</span>
                <span className="font-bold text-gray-400">{c.discountDepth}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Segment sidebar row
// ─────────────────────────────────────────────────────────────────────────────

const SIDEBAR_SEGMENTS = [
  { name: 'Champions',          hex: '#f59e0b', action: 'Reward & upsell'      },
  { name: 'Loyal Customers',    hex: '#10b981', action: 'Loyalty program'      },
  { name: 'Potential Loyalist', hex: '#3b82f6', action: 'Nurture & engage'     },
  { name: 'New Customers',      hex: '#06b6d4', action: 'Onboarding flow'      },
  { name: 'Promising',          hex: '#8b5cf6', action: 'Early incentives'     },
  { name: 'Need Attention',     hex: '#f97316', action: 'Re-engage now'        },
  { name: "Can't Lose Them",    hex: '#ef4444', action: 'Personal outreach'    },
  { name: 'At Risk',            hex: '#dc2626', action: 'Urgent campaign'      },
  { name: 'Hibernating',        hex: '#6b7280', action: 'Low-cost reactivate'  },
  { name: 'Lost',               hex: '#374151', action: 'Sunset or survey'     },
];

function getSidebarUsers(name: string): number {
  return Object.entries(CELL_SEGMENT_MAP)
    .filter(([, v]) => v.name === name)
    .reduce((sum, [k]) => sum + (SCALE_USER_COUNTS[k] ?? 0), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  selectedSegment?: SegmentName | 'All';
}

const RFMHeatmapGrid: React.FC<Props> = ({ selectedSegment = 'All' }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('users');
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ r: number; f: number } | null>(null);

  // Compute max value per view mode for opacity scaling
  const maxValue = useMemo(() => {
    const vals = Object.keys(SCALE_USER_COUNTS).map(k => {
      if (viewMode === 'users')   return SCALE_USER_COUNTS[k];
      if (viewMode === 'revenue') return SCALE_USER_COUNTS[k] * (SCALE_AVG_ORDER[k] ?? 0);
      return SCALE_AVG_ORDER[k] ?? 0;
    });
    return Math.max(...vals);
  }, [viewMode]);

  const getCellValue = useCallback((r: number, f: number) => {
    const k = `${r}-${f}`;
    if (viewMode === 'users')   return SCALE_USER_COUNTS[k] ?? 0;
    if (viewMode === 'revenue') return (SCALE_USER_COUNTS[k] ?? 0) * (SCALE_AVG_ORDER[k] ?? 0);
    return SCALE_AVG_ORDER[k] ?? 0;
  }, [viewMode]);

  const formatCellValue = (val: number): string => {
    if (viewMode === 'revenue') return `₹${(val / 1000).toFixed(0)}k`;
    if (viewMode === 'aov')     return `₹${val}`;
    return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val);
  };

  const isCellDimmed = useCallback((r: number, f: number): boolean => {
    if (selectedSegment === 'All') return false;
    const key = `${r}-${f}`;
    return CELL_SEGMENT_MAP[key]?.segment !== selectedSegment;
  }, [selectedSegment]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-900 text-base">RFM Customer Heatmap</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            47,456 customers · Click any cell to drill down · Hover for details
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['users', 'revenue', 'aov'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                viewMode === mode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode === 'users' ? 'Users' : mode === 'revenue' ? 'Revenue' : 'Avg Order'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex">

        {/* ── Grid area ── */}
        <div className="flex-1 p-6 overflow-x-auto">
          <div className="flex gap-0 min-w-[420px]">

            {/* Y-axis label */}
            <div className="flex flex-col items-center justify-center pr-2 w-7 flex-shrink-0">
              <span
                className="text-[10px] font-bold text-gray-400 uppercase tracking-widest select-none"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                Frequency Score →
              </span>
            </div>

            <div className="flex-1">
              {/* Rows: F=5 (top) → F=1 (bottom) */}
              {[5, 4, 3, 2, 1].map((f, fi) => (
                <div key={f} className={`flex items-center gap-1 ${fi < 4 ? 'mb-1' : ''}`}>
                  {/* F label */}
                  <div className="w-5 flex-shrink-0 text-center text-xs font-bold text-gray-300 select-none">
                    {f}
                  </div>

                  {/* Cells R=1..5 */}
                  {[1, 2, 3, 4, 5].map(r => {
                    const key = `${r}-${f}`;
                    const seg = CELL_SEGMENT_MAP[key];
                    const val = getCellValue(r, f);
                    const opacity = 0.15 + (val / maxValue) * 0.80;
                    const isSelected = selectedCell?.r === r && selectedCell?.f === f;
                    const isDimmed = isCellDimmed(r, f);
                    const trend = TREND_DATA[key];

                    return (
                      <div
                        key={r}
                        className="flex-1 rounded-xl cursor-pointer select-none transition-all duration-150 relative"
                        style={{
                          aspectRatio: '1',
                          minWidth: 52,
                          minHeight: 52,
                          background: seg?.hex ?? '#e5e7eb',
                          opacity: isDimmed ? 0.15 : opacity,
                          outline: isSelected ? `2.5px solid ${seg?.hex}` : '2px solid transparent',
                          outlineOffset: 2,
                          transform: isSelected ? 'scale(1.07)' : 'scale(1)',
                          boxShadow: isSelected ? `0 4px 20px ${seg?.hex}50` : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                        }}
                        onClick={() =>
                          setSelectedCell(prev =>
                            prev?.r === r && prev?.f === f ? null : { r, f },
                          )
                        }
                        onMouseEnter={e =>
                          setTooltip({ r, f, x: e.clientX, y: e.clientY })
                        }
                        onMouseMove={e =>
                          setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
                        }
                        onMouseLeave={() => setTooltip(null)}
                      >
                        {/* Value */}
                        <span
                          className="font-extrabold text-white leading-none"
                          style={{
                            fontSize: 12,
                            textShadow: '0 1px 3px rgba(0,0,0,0.35)',
                          }}
                        >
                          {formatCellValue(val)}
                        </span>

                        {/* Trend arrow */}
                        {trend && (
                          <span
                            className="font-bold leading-none"
                            style={{
                              fontSize: 9,
                              color: trend.delta > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,200,200,0.9)',
                            }}
                          >
                            {trend.delta > 0 ? `↑${trend.delta}%` : `↓${Math.abs(trend.delta)}%`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* X-axis labels */}
              <div className="flex mt-1.5 ml-6 gap-1">
                {[1, 2, 3, 4, 5].map(r => (
                  <div key={r} className="flex-1 text-center text-xs font-bold text-gray-300 select-none">
                    {r}
                  </div>
                ))}
              </div>
              <div className="text-center mt-1 ml-6">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  → Recency Score
                </span>
              </div>

              {/* Density legend */}
              <div className="flex items-center gap-3 mt-4 ml-6">
                <span className="text-[10px] text-gray-300 font-semibold">Low</span>
                <div
                  className="h-2 rounded-full flex-1 max-w-32"
                  style={{
                    background: 'linear-gradient(to right, rgba(100,100,100,0.15), rgba(245,158,11,0.9))',
                  }}
                />
                <span className="text-[10px] text-gray-300 font-semibold">High</span>
                <span className="text-[10px] text-gray-400 ml-1">
                  {viewMode === 'users' ? 'User density' : viewMode === 'revenue' ? 'Revenue' : 'Avg order'}
                </span>
              </div>
            </div>
          </div>

          {/* Drill-down panel */}
          {selectedCell && (
            <DrillDownPanel
              r={selectedCell.r}
              f={selectedCell.f}
              onClose={() => setSelectedCell(null)}
            />
          )}
        </div>

        {/* ── Right sidebar: segment list ── */}
        <div className="w-56 border-l border-gray-100 p-4 flex-shrink-0 hidden lg:block">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
            Segments
          </p>
          <div className="space-y-1.5">
            {SIDEBAR_SEGMENTS.map(s => {
              const users = getSidebarUsers(s.name);
              return (
                <div
                  key={s.name}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors cursor-default"
                  style={{ borderLeft: `3px solid ${s.hex}` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
                    <p className="text-[10px] text-gray-400">{s.action}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-800">
                      {users >= 1000 ? `${(users / 1000).toFixed(1)}k` : users}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

     
      {tooltip && <CellTooltip data={tooltip} />}
    </div>
  );
};

export default RFMHeatmapGrid;