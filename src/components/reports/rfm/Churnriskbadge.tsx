// ─────────────────────────────────────────────────────────────────────────────
// ChurnRiskBadge.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { ChurnRisk } from './rmf.type';
import { AlertTriangle, ShieldCheck, AlertCircle, Flame } from 'lucide-react';

interface Props {
  risk: ChurnRisk;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const CONFIG: Record<ChurnRisk, {
  label: string;
  classes: string;
  icon: React.ReactNode;
}> = {
  Low: {
    label: 'Low',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <ShieldCheck size={10} />,
  },
  Medium: {
    label: 'Medium',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <AlertCircle size={10} />,
  },
  High: {
    label: 'High',
    classes: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: <AlertTriangle size={10} />,
  },
  Critical: {
    label: 'Critical',
    classes: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <Flame size={10} />,
  },
};

const ChurnRiskBadge: React.FC<Props> = ({ risk, size = 'sm', showIcon = true }) => {
  const cfg = CONFIG[risk];
  return (
    <span className={`
      inline-flex items-center gap-1 font-bold border rounded-full whitespace-nowrap
      ${cfg.classes}
      ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}
    `}>
      {showIcon && cfg.icon}
      {cfg.label}
    </span>
  );
};

export default ChurnRiskBadge;