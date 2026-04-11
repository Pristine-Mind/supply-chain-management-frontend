import React, { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { ScatterPoint, SegmentName } from './rmf.type';

interface Props {
  data: ScatterPoint[];
  selectedSegment: SegmentName | 'All';
}

const SEGMENT_COLORS: Record<SegmentName, string> = {
  Champion: '#f59e0b',
  Loyal:    '#10b981',
  Potential:'#3b82f6',
  'At Risk':'#f97316',
  Dormant:  '#e11d48',
};

// Custom dot — size driven by monetary score
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const r = 4 + payload.monetary * 2; // 6–14 px
  const color = SEGMENT_COLORS[payload.segment as SegmentName];
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={color}
      fillOpacity={0.75}
      stroke={color}
      strokeWidth={1}
    />
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: ScatterPoint = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-bold text-gray-800 mb-1">{d.name}</p>
      <p className="text-gray-500">Segment: <span className="font-semibold text-gray-700">{d.segment}</span></p>
      <p className="text-gray-500">Recency: <span className="font-semibold text-gray-700">{d.recency}/5</span></p>
      <p className="text-gray-500">Frequency: <span className="font-semibold text-gray-700">{d.frequency}/5</span></p>
      <p className="text-gray-500">Monetary: <span className="font-semibold text-gray-700">{d.monetary}/5</span></p>
      <p className="text-gray-500">Churn score: <span className="font-semibold text-rose-600">{Math.round(d.churnScore * 100)}%</span></p>
    </div>
  );
};

const SEGMENTS: SegmentName[] = ['Champion', 'Loyal', 'Potential', 'At Risk', 'Dormant'];

const RFMScatterChart: React.FC<Props> = ({ data, selectedSegment }) => {
  const filtered = selectedSegment === 'All'
    ? data
    : data.filter((d) => d.segment === selectedSegment);

  // Group by segment for separate <Scatter> (enables legend colouring)
  const grouped = SEGMENTS.reduce<Record<SegmentName, ScatterPoint[]>>(
    (acc, seg) => {
      acc[seg] = filtered.filter((d) => d.segment === seg);
      return acc;
    },
    {} as Record<SegmentName, ScatterPoint[]>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-4">
        <h3 className="font-bold text-gray-800">Recency × Frequency Map</h3>
        <p className="text-xs text-gray-400 mt-0.5">Dot size = Monetary score · Top-right = highest value customers</p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            type="number"
            dataKey="recency"
            domain={[0, 5.5]}
            ticks={[1, 2, 3, 4, 5]}
            label={{ value: 'Recency Score', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#9ca3af' }}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
          />
          <YAxis
            type="number"
            dataKey="frequency"
            domain={[0, 5.5]}
            ticks={[1, 2, 3, 4, 5]}
            label={{ value: 'Frequency Score', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#9ca3af' }}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
            formatter={(value) => <span className="text-gray-600">{value}</span>}
          />
          {SEGMENTS.map((seg) =>
            grouped[seg].length ? (
              <Scatter
                key={seg}
                name={seg}
                data={grouped[seg]}
                fill={SEGMENT_COLORS[seg]}
                shape={<CustomDot />}
              />
            ) : null
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RFMScatterChart;