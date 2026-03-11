// ─────────────────────────────────────────────────────────────────────────────
// SegmentTable.tsx


// Props:
//   customers        — full Customer[] array (pass DUMMY_CUSTOMERS)
//   selectedSegment  — filters to that segment when not 'All'
//   onCustomerClick  — called with Customer when a row is clicked (Step 7)
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useState, useMemo, useRef, useCallback,
  useEffect, useLayoutEffect,
} from 'react';
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown,
  UserCircle, TrendingDown,
} from 'lucide-react';
import { Customer, SegmentName, ChurnRisk, CLVTier } from './rmf.type';

// ── Constants ─────────────────────────────────────────────────────────────────
const ROW_H    = 60;   // px — must stay in sync with the row's min-height below
const OVERSCAN = 6;    // extra rows rendered above + below the viewport
const DEBOUNCE = 200;  // ms — search debounce

// ── Types ─────────────────────────────────────────────────────────────────────
type SortKey =
  | 'name' | 'churnScore' | 'rfmComposite'
  | 'totalRevenue' | 'clv90Day' | 'lastPurchase' | 'totalOrders';
type SortDir = 'asc' | 'desc';

interface Props {
  customers: Customer[];
  selectedSegment: SegmentName | 'All';
  onCustomerClick?: (customer: Customer) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Churn score → Tailwind bar color
function churnBarColor(score: number): string {
  if (score < 0.35) return 'bg-emerald-500';
  if (score < 0.55) return 'bg-amber-400';
  if (score < 0.70) return 'bg-orange-500';
  return 'bg-rose-600';
}

// Churn risk → badge styles
const RISK_BADGE: Record<ChurnRisk, string> = {
  Low:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium:   'bg-amber-50   text-amber-700   border-amber-200',
  High:     'bg-orange-50  text-orange-700  border-orange-200',
  Critical: 'bg-rose-50    text-rose-700    border-rose-200',
};

// CLV tier → badge styles
const CLV_BADGE: Record<CLVTier, string> = {
  Platinum: 'bg-violet-50 text-violet-700 border-violet-200',
  Gold:     'bg-amber-50  text-amber-700  border-amber-200',
  Silver:   'bg-gray-100  text-gray-600   border-gray-200',
  Bronze:   'bg-orange-50 text-orange-600 border-orange-200',
};

// Segment → accent color for focus ring on search input
const SEGMENT_RING: Record<string, string> = {
  Champion:  'focus:ring-amber-300',
  Loyal:     'focus:ring-emerald-300',
  Potential: 'focus:ring-blue-300',
  'At Risk': 'focus:ring-orange-300',
  Dormant:   'focus:ring-rose-300',
  All:       'focus:ring-gray-300',
};

// ── Sort Icon ─────────────────────────────────────────────────────────────────
const SortIcon: React.FC<{ col: SortKey; active: SortKey; dir: SortDir }> = ({
  col, active, dir,
}) => {
  if (col !== active) return <ChevronsUpDown size={11} className="text-gray-300" />;
  return dir === 'asc'
    ? <ChevronUp   size={11} className="text-orange-500" />
    : <ChevronDown size={11} className="text-orange-500" />;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const SegmentTable: React.FC<Props> = ({
  customers,
  selectedSegment,
  onCustomerClick,
}) => {
  const [search,      setSearch     ] = useState('');
  const [riskFilter,  setRiskFilter ] = useState<ChurnRisk | 'All'>('All');
  const [clvFilter,   setClvFilter  ] = useState<CLVTier   | 'All'>('All');
  const [sortKey,     setSortKey    ] = useState<SortKey>('churnScore');
  const [sortDir,     setSortDir    ] = useState<SortDir>('desc');

  const debouncedSearch = useDebounce(search, DEBOUNCE);

  // ── 1. Filter + sort (single memoised pass) ───────────────────────────────
  const sorted = useMemo<Customer[]>(() => {
    let rows = customers;

    if (selectedSegment !== 'All')
      rows = rows.filter(c => c.segment === selectedSegment);

    if (riskFilter !== 'All')
      rows = rows.filter(c => c.churnRisk === riskFilter);

    if (clvFilter !== 'All')
      rows = rows.filter(c => c.clvTier === clvFilter);

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      rows = rows.filter(
        c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
      );
    }

    return [...rows].sort((a, b) => {
      const av = a[sortKey as keyof Customer];
      const bv = b[sortKey as keyof Customer];
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc'
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
  }, [customers, selectedSegment, riskFilter, clvFilter, debouncedSearch, sortKey, sortDir]);

  // ── 2. Virtual scroll ─────────────────────────────────────────────────────
  const scrollRef   = useRef<HTMLDivElement>(null);
  const [viewH,    setViewH   ] = useState(480);
  const [scrollTop, setScrollTop] = useState(0);

  useLayoutEffect(() => {
    if (scrollRef.current) setViewH(scrollRef.current.clientHeight);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalH   = sorted.length * ROW_H;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const endIdx   = Math.min(sorted.length, Math.ceil((scrollTop + viewH) / ROW_H) + OVERSCAN);
  const visible  = sorted.slice(startIdx, endIdx);

  // ── 3. Sort handler ───────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const ring = SEGMENT_RING[selectedSegment] ?? 'focus:ring-gray-300';

  // ── Th helper ─────────────────────────────────────────────────────────────
  const Th: React.FC<{ col: SortKey; label: string; className?: string }> = ({
    col, label, className = '',
  }) => (
    <th
      onClick={() => handleSort(col)}
      className={`
        px-4 py-3 text-left text-[11px] font-bold text-gray-400
        uppercase tracking-wider cursor-pointer select-none
        hover:text-gray-700 transition-colors whitespace-nowrap ${className}
      `}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon col={col} active={sortKey} dir={sortDir} />
      </div>
    </th>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-gray-900 text-sm">Customers</h3>
          {/* Virtual scroll badge */}
          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5">
            Virtual scroll · {sorted.length.toLocaleString()} rows
          </span>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`
                pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-xl
                focus:outline-none focus:ring-2 ${ring} w-52
                transition-shadow
              `}
            />
          </div>

          {/* Churn risk filter */}
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value as ChurnRisk | 'All')}
            className={`text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2
              focus:outline-none focus:ring-2 ${ring} text-gray-600 bg-white cursor-pointer`}
          >
            <option value="All">All risks</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          {/* CLV tier filter */}
          <select
            value={clvFilter}
            onChange={e => setClvFilter(e.target.value as CLVTier | 'All')}
            className={`text-xs font-semibold border border-gray-200 rounded-xl px-3 py-2
              focus:outline-none focus:ring-2 ${ring} text-gray-600 bg-white cursor-pointer`}
          >
            <option value="All">All CLV tiers</option>
            <option value="Platinum">Platinum</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Bronze">Bronze</option>
          </select>

          {/* Count */}
          <span className="text-xs text-gray-400 font-medium">
            {sorted.length.toLocaleString()} / {customers.length.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Sticky header ── */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed">
          <colgroup>
            <col style={{ width: 200 }} /> {/* Customer       */}
            <col style={{ width: 110 }} /> {/* Segment        */}
            <col style={{ width: 100 }} /> {/* Churn Risk     */}
            <col style={{ width: 130 }} /> {/* Churn Score    */}
            <col style={{ width: 80  }} /> {/* RFM            */}
            <col style={{ width: 110 }} /> {/* Revenue        */}
            <col style={{ width: 110 }} /> {/* CLV 90d        */}
            <col style={{ width: 110 }} /> {/* Last Purchase  */}
            <col style={{ width: 130 }} /> {/* Top Driver     */}
            <col style={{ width: 80  }} /> {/* Action         */}
          </colgroup>
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <Th col="name"         label="Customer"      />
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Segment
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Risk
              </th>
              <Th col="churnScore"   label="Churn Score"   />
              <Th col="rfmComposite" label="RFM"           />
              <Th col="totalRevenue" label="Revenue"       />
              <Th col="clv90Day"     label="CLV 90d"       />
              <Th col="lastPurchase" label="Last Purchase" />
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Top Driver
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Campaign
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* ── Virtual scroll container ── */}
      <div className="overflow-x-auto">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ height: 480, overflowY: 'auto' }}
          className="relative"
        >
          {/* Full-height spacer so scrollbar reflects total rows */}
          <div style={{ height: totalH, position: 'relative' }}>
            <table
              className="w-full min-w-[900px] table-fixed"
              style={{
                position: 'absolute',
                top: startIdx * ROW_H,
                left: 0,
                right: 0,
              }}
            >
              <colgroup>
                <col style={{ width: 200 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 80  }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 80  }} />
              </colgroup>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-16 text-center text-gray-400 text-sm"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <UserCircle size={32} className="text-gray-200" />
                        <p>No customers match the current filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : visible.map(c => (
                  <tr
                    key={c.id}
                    style={{ height: ROW_H }}
                    onClick={() => onCustomerClick?.(c)}
                    className={`
                      border-b border-gray-50 transition-colors
                      ${onCustomerClick ? 'cursor-pointer hover:bg-orange-50/40' : 'hover:bg-gray-50/60'}
                    `}
                  >
                    {/* Customer name + email */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                        {c.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{c.email}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">{c.city}</p>
                    </td>

                    {/* Segment badge */}
                    <td className="px-4 py-3">
                      <span className={`
                        inline-flex items-center text-[10px] font-bold px-2 py-1
                        rounded-full border whitespace-nowrap
                        ${c.segment === 'Champion'  ? 'bg-amber-50   text-amber-700   border-amber-200'   : ''}
                        ${c.segment === 'Loyal'     ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                        ${c.segment === 'Potential' ? 'bg-blue-50    text-blue-700    border-blue-200'    : ''}
                        ${c.segment === 'At Risk'   ? 'bg-orange-50  text-orange-700  border-orange-200'  : ''}
                        ${c.segment === 'Dormant'   ? 'bg-rose-50    text-rose-700    border-rose-200'    : ''}
                      `}>
                        {c.segment}
                      </span>
                    </td>

                    {/* Churn risk badge */}
                    <td className="px-4 py-3">
                      <span className={`
                        inline-flex items-center text-[10px] font-bold
                        px-2 py-1 rounded-full border whitespace-nowrap
                        ${RISK_BADGE[c.churnRisk]}
                      `}>
                        {c.churnRisk}
                      </span>
                    </td>

                    {/* Churn score bar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className={`h-full rounded-full transition-all ${churnBarColor(c.churnScore)}`}
                            style={{ width: `${c.churnScore * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${
                          c.churnScore >= 0.70 ? 'text-rose-600' :
                          c.churnScore >= 0.55 ? 'text-orange-500' :
                          c.churnScore >= 0.35 ? 'text-amber-500' : 'text-emerald-600'
                        }`}>
                          {Math.round(c.churnScore * 100)}%
                        </span>
                      </div>
                    </td>

                    {/* RFM composite */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-gray-700">
                        {c.rfmComposite.toFixed(1)}
                      </span>
                    </td>

                    {/* Revenue */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        ₹{c.totalRevenue.toLocaleString()}
                      </span>
                    </td>

                    {/* CLV 90d */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-800">
                          ₹{c.clv90Day.toLocaleString()}
                        </span>
                        <span className={`
                          text-[9px] font-bold px-1.5 py-0.5 rounded-full border w-fit
                          ${CLV_BADGE[c.clvTier]}
                        `}>
                          {c.clvTier}
                        </span>
                      </div>
                    </td>

                    {/* Last purchase */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{c.lastPurchase}</span>
                    </td>

                    {/* Top churn driver */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-1">
                        <TrendingDown size={11} className="text-rose-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-500 leading-tight line-clamp-2">
                          {c.topChurnDriver}
                        </span>
                      </div>
                    </td>

                    {/* Campaign type */}
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-semibold bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded-lg whitespace-nowrap">
                        {c.campaignType.split(' / ')[0]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {sorted.length.toLocaleString()} customers
          {selectedSegment !== 'All' ? ` in ${selectedSegment}` : ' across all segments'}
          {' · '}virtual scroll active
        </span>
        {onCustomerClick && (
          <span className="text-[11px] text-gray-400">
            Click any row to see SHAP churn explanation →
          </span>
        )}
      </div>
    </div>
  );
};

export default SegmentTable;