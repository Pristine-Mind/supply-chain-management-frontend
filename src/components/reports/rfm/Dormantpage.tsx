import React, { useState, useMemo } from 'react';
import { DUMMY_CUSTOMERS } from './Rfm.data';

import ChurnRiskBadge from './Churnriskbadge';
import {
  Moon, DollarSign, Users, AlertTriangle,
  Search, ChevronUp, ChevronDown, ChevronsUpDown, ArrowLeft
} from 'lucide-react';

type SortKey = 'name' | 'churnScore' | 'rfmComposite' | 'totalRevenue' | 'clv90Day' | 'lastPurchase';
type SortDir = 'asc' | 'desc';

const SortIcon: React.FC<{ col: SortKey; current: SortKey; dir: SortDir }> = ({ col, current, dir }) => {
  if (col !== current) return <ChevronsUpDown size={12} className="text-gray-300" />;
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-rose-500" />
    : <ChevronDown size={12} className="text-rose-500" />;
};

const DormantPage: React.FC = () => {
  const customers = DUMMY_CUSTOMERS.filter(c => c.segment === 'Dormant');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('churnScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const avgChurn  = Math.round(customers.reduce((s, c) => s + c.churnScore, 0) / customers.length * 100);
  const totalRev  = customers.reduce((s, c) => s + c.totalRevenue, 0);
  const avgDays   = 110; // static dummy: avg days since last purchase
  const recov     = Math.round(customers.reduce((s, c) => s + c.clv90Day, 0));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let rows = customers;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [customers, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const Th: React.FC<{ col: SortKey; label: string }> = ({ col, label }) => (
    <th onClick={() => handleSort(col)}
      className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-rose-600 select-none">
      <div className="flex items-center gap-1">{label}<SortIcon col={col} current={sortKey} dir={sortDir} /></div>
    </th>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">

      {/* Back */}
      <a href="/reports/rfm-segments"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors">
        <ArrowLeft size={15} /> Back to RFM Overview
      </a>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-rose-100 rounded-xl">
          <Moon size={22} className="text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔴 Dormant</h1>
          <p className="text-sm text-gray-400">
            Zero recent activity · Critical churn risk — win-back or sunset decision
          </p>
        </div>
        <span className="ml-auto bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 rounded-full">
          Win-back or Sunset campaign
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Dormant Customers', value: customers.length.toString(),     sub: 'In segment',           icon: <Users size={16} className="text-rose-600" />,       bg: 'bg-rose-50'   },
          { label: 'Avg Churn Score',   value: `${avgChurn}%`,                  sub: 'Near-certain churn',   icon: <AlertTriangle size={16} className="text-rose-600" />, bg: 'bg-rose-50'   },
          { label: 'Revenue Lost',      value: `$${totalRev.toLocaleString()}`, sub: 'Historical spend',     icon: <DollarSign size={16} className="text-gray-500" />,   bg: 'bg-gray-100'  },
          { label: 'Potential Recovery',value: `$${recov.toLocaleString()}`,    sub: 'If reactivated (CLV)', icon: <DollarSign size={16} className="text-emerald-600" />, bg: 'bg-emerald-50'},
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${k.bg}`}>{k.icon}</div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{k.label}</p>
              <p className="text-xl font-bold text-gray-800">{k.value}</p>
              <p className="text-[11px] text-gray-400">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <h3 className="font-bold text-gray-800">Dormant Customers</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 w-40" />
            </div>
            <span className="text-xs text-gray-400">{filtered.length} customers</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <Th col="name"         label="Customer" />
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Churn Risk</th>
                <Th col="churnScore"   label="Score" />
                <Th col="rfmComposite" label="RFM" />
                <Th col="totalRevenue" label="Hist. Revenue" />
                <Th col="clv90Day"     label="CLV 90d" />
                <Th col="lastPurchase" label="Last Purchase" />
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Top Driver</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">No customers match.</td></tr>
              ) : paginated.map(c => (
                <tr key={c.id} className="hover:bg-rose-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </td>
                  <td className="px-4 py-3"><ChurnRiskBadge risk={c.churnRisk} size="sm" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-rose-600"
                          style={{ width: `${c.churnScore * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-rose-600">{Math.round(c.churnScore * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">{c.rfmComposite.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 line-through">${c.totalRevenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-emerald-600 font-medium">${c.clv90Day.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.lastPurchase}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.topChurnDriver}</td>
                  <td className="px-4 py-3">
                    {/* Sunset vs win-back decision based on CLV */}
                    {c.clv90Day >= 40 ? (
                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium whitespace-nowrap">
                        Win-back
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded font-medium whitespace-nowrap">
                        Sunset
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DormantPage;