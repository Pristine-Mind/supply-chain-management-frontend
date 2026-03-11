import React, { useState, useMemo } from 'react';
import { DUMMY_CUSTOMERS } from './Rfm.data';
import { ChurnRisk } from './rmf.type';
import ChurnRiskBadge from './Churnriskbadge';
import {
  TrendingUp, DollarSign, Users, Star,
  Search, ChevronUp, ChevronDown, ChevronsUpDown, ArrowLeft
} from 'lucide-react';

type SortKey = 'name' | 'churnScore' | 'rfmComposite' | 'totalRevenue' | 'clv90Day' | 'totalOrders';
type SortDir = 'asc' | 'desc';

const SortIcon: React.FC<{ col: SortKey; current: SortKey; dir: SortDir }> = ({ col, current, dir }) => {
  if (col !== current) return <ChevronsUpDown size={12} className="text-gray-300" />;
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-amber-500" />
    : <ChevronDown size={12} className="text-amber-500" />;
};

const ChampionsPage: React.FC = () => {
  const customers = DUMMY_CUSTOMERS.filter(c => c.segment === 'Champion');
  const [search, setSearch] = useState('');
  const [churnFilter, setChurnFilter] = useState<ChurnRisk | 'All'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('totalRevenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const avgRevenue = Math.round(customers.reduce((s, c) => s + c.totalRevenue, 0) / customers.length);
  const avgClv     = Math.round(customers.reduce((s, c) => s + c.clv90Day, 0) / customers.length);
  const avgOrders  = Math.round(customers.reduce((s, c) => s + c.totalOrders, 0) / customers.length);
  const avgChurn   = Math.round(customers.reduce((s, c) => s + c.churnScore, 0) / customers.length * 100);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let rows = customers;
    if (churnFilter !== 'All') rows = rows.filter(c => c.churnRisk === churnFilter);
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
  }, [customers, search, churnFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const Th: React.FC<{ col: SortKey; label: string }> = ({ col, label }) => (
    <th onClick={() => handleSort(col)}
      className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-amber-600 select-none">
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
        <div className="p-2.5 bg-amber-100 rounded-xl">
          <Star size={22} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🥇 Champions</h1>
          <p className="text-sm text-gray-400">
            High recency · High frequency · High monetary — your most valuable buyers
          </p>
        </div>
        <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
          Loyalty Reward campaign
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Champions', value: customers.length.toString(), sub: 'In segment',       icon: <Users size={16} className="text-amber-600" />,   bg: 'bg-amber-50'   },
          { label: 'Avg Revenue',     value: `$${avgRevenue.toLocaleString()}`, sub: 'Per customer', icon: <DollarSign size={16} className="text-emerald-600" />, bg: 'bg-emerald-50' },
          { label: 'Avg CLV (90d)',   value: `$${avgClv.toLocaleString()}`,     sub: 'Predicted',    icon: <TrendingUp size={16} className="text-blue-600" />,   bg: 'bg-blue-50'    },
          { label: 'Avg Churn Score', value: `${avgChurn}%`,                    sub: 'Low = healthy', icon: <Star size={16} className="text-purple-600" />,      bg: 'bg-purple-50'  },
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
          <h3 className="font-bold text-gray-800">Champion Customers</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 w-40" />
            </div>
            <select value={churnFilter} onChange={e => { setChurnFilter(e.target.value as any); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-300">
              <option value="All">All risks</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <span className="text-xs text-gray-400">{filtered.length} customers</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <Th col="name"         label="Customer" />
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Churn Risk</th>
                <Th col="churnScore"   label="Score" />
                <Th col="rfmComposite" label="RFM" />
                <Th col="totalRevenue" label="Revenue" />
                <Th col="clv90Day"     label="CLV 90d" />
                <Th col="totalOrders"  label="Orders" />
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Top Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">No customers match.</td></tr>
              ) : paginated.map(c => (
                <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </td>
                  <td className="px-4 py-3"><ChurnRiskBadge risk={c.churnRisk} size="sm" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${c.churnScore < 0.35 ? 'bg-emerald-500' : c.churnScore < 0.55 ? 'bg-amber-500' : 'bg-rose-600'}`}
                          style={{ width: `${c.churnScore * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{Math.round(c.churnScore * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">{c.rfmComposite.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">${c.totalRevenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">${c.clv90Day.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.totalOrders}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{c.topChurnDriver}</td>
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

export default ChampionsPage;