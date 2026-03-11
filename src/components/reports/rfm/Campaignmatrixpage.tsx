import React, { useState } from 'react';
import { CAMPAIGN_MATRIX, DUMMY_CUSTOMERS } from './Rfm.data';
import { SegmentName, ChurnRisk } from "./rmf.type"
import { Target, ArrowLeft, Filter } from 'lucide-react';

const SEGMENTS: SegmentName[] = ['Champion', 'Loyal', 'Potential', 'At Risk', 'Dormant'];
const RISKS: ChurnRisk[]      = ['Low', 'Medium', 'High', 'Critical'];

const SEGMENT_EMOJI: Record<SegmentName, string> = {
  Champion: '🥇', Loyal: '🟢', Potential: '🔵', 'At Risk': '🟡', Dormant: '🔴',
};

const RISK_BADGE: Record<ChurnRisk, string> = {
  Low:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium:   'bg-amber-50   text-amber-700   border-amber-200',
  High:     'bg-orange-50  text-orange-700  border-orange-200',
  Critical: 'bg-rose-50    text-rose-700    border-rose-200',
};

const URGENCY_BORDER: Record<1 | 2 | 3 | 4, string> = {
  1: 'border-l-rose-500',
  2: 'border-l-orange-500',
  3: 'border-l-amber-400',
  4: 'border-l-emerald-400',
};

const URGENCY_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: 'bg-rose-100 text-rose-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-amber-100 text-amber-700',
  4: 'bg-gray-100 text-gray-500',
};

const CampaignMatrixPage: React.FC = () => {
  const [highlightSeg, setHighlightSeg] = useState<SegmentName | 'All'>('All');
  const [highlightRisk, setHighlightRisk] = useState<ChurnRisk | 'All'>('All');

  // Count customers per cell for a "population" indicator
  const cellCount = (seg: SegmentName, risk: ChurnRisk) =>
    DUMMY_CUSTOMERS.filter(c => c.segment === seg && c.churnRisk === risk).length;

  const isHighlighted = (seg: SegmentName, risk: ChurnRisk) =>
    (highlightSeg === 'All' || highlightSeg === seg) &&
    (highlightRisk === 'All' || highlightRisk === risk);

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">

      {/* Back */}
      <a href="/reports/rfm-segments"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors">
        <ArrowLeft size={15} /> Back to RFM Overview
      </a>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-orange-100 rounded-xl">
          <Target size={22} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Decision Matrix</h1>
          <p className="text-sm text-gray-400">
            Segment × Churn Risk → recommended action, channels &amp; incentive depth
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
        <Filter size={14} className="text-gray-400" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Highlight:</span>

        <div className="flex flex-wrap gap-1.5">
          {(['All', ...SEGMENTS] as const).map(s => (
            <button key={s} onClick={() => setHighlightSeg(s as any)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                highlightSeg === s
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}>
              {s === 'All' ? 'All Segments' : `${SEGMENT_EMOJI[s as SegmentName]} ${s}`}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <div className="flex flex-wrap gap-1.5">
          {(['All', ...RISKS] as const).map(r => (
            <button key={r} onClick={() => setHighlightRisk(r as any)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                highlightRisk === r
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}>
              {r === 'All' ? 'All Risks' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr>
              <th className="pb-3 pr-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">
                Segment
              </th>
              {RISKS.map(risk => (
                <th key={risk} className="pb-3 px-2 text-center">
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${RISK_BADGE[risk]}`}>
                    {risk}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {SEGMENTS.map(seg => (
              <tr key={seg} className="align-top">
                <td className="py-3 pr-3 text-sm font-bold text-gray-700 whitespace-nowrap">
                  {SEGMENT_EMOJI[seg]} {seg}
                </td>
                {RISKS.map(risk => {
                  const cell = CAMPAIGN_MATRIX.find(c => c.segment === seg && c.churnRisk === risk);
                  const count = cellCount(seg, risk);
                  const active = isHighlighted(seg, risk);
                  if (!cell) return <td key={risk} className="py-3 px-2" />;
                  return (
                    <td key={risk} className="py-2 px-2">
                      <div className={`
                        rounded-lg border border-gray-100 border-l-4 p-2.5 transition-all duration-200
                        ${URGENCY_BORDER[cell.urgencyLevel]}
                        ${active ? 'bg-gray-50 shadow-sm' : 'bg-white opacity-40'}
                      `}>
                        <p className="text-[11px] font-semibold text-gray-700 leading-snug mb-1.5">
                          {cell.action}
                        </p>

                        {/* Channels */}
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {cell.channels.map(ch => (
                            <span key={ch} className="text-[9px] bg-white border border-gray-200 rounded px-1 py-0.5 text-gray-500 font-medium">
                              {ch}
                            </span>
                          ))}
                        </div>

                        {/* Discount + Urgency + Customer count */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-orange-600">{cell.discountDepth} off</span>
                          <div className="flex items-center gap-1">
                            {count > 0 && (
                              <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                                {count} users
                              </span>
                            )}
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${URGENCY_LABEL[cell.urgencyLevel]}`}>
                              U{cell.urgencyLevel}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-5 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-500" />U1 — Highest urgency (SMS + all channels)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-500" />U2 — High urgency (Push + Email)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400" />U3 — Medium urgency (Email)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400" />U4 — Standard (organic / no discount)</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'U1 Critical Actions',  count: CAMPAIGN_MATRIX.filter(c => c.urgencyLevel === 1).length, color: 'border-rose-400   bg-rose-50   text-rose-700'   },
          { label: 'U2 High Actions',      count: CAMPAIGN_MATRIX.filter(c => c.urgencyLevel === 2).length, color: 'border-orange-400 bg-orange-50 text-orange-700' },
          { label: 'U3 Medium Actions',    count: CAMPAIGN_MATRIX.filter(c => c.urgencyLevel === 3).length, color: 'border-amber-400  bg-amber-50  text-amber-700'  },
          { label: 'U4 Standard Actions',  count: CAMPAIGN_MATRIX.filter(c => c.urgencyLevel === 4).length, color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border-2 p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-semibold mt-0.5 opacity-80">{s.label}</p>
            <p className="text-[10px] opacity-60 mt-0.5">campaign rules defined</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignMatrixPage;