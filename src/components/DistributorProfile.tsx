import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3,
  Eye, 
  ShoppingBag, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard,
  TrendingUp,
  ArrowUpRight,
  Package
} from 'lucide-react';
import { 
    getDistributorProfile, 
    listDistributorOrders, 
    DistributorProfileResponse, 
    DistributorProduct 
} from '../api/distributorApi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import banner from '../assets/banner_new.png';

// --- Sub-component: Metric Card ---
const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
    <div className={`p-3 rounded-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

// --- Sub-component: Performance Chart ---
const ProductChart: React.FC<{ products: DistributorProduct[] }> = ({ products }) => {
  const chartData = useMemo(() => products.slice(0, 5), [products]);
  const maxVal = useMemo(() => Math.max(...chartData.map(p => p.views ?? 0), 1), [chartData]);

  return (
    <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
      <CardHeader className="pb-2 border-b border-slate-50">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <TrendingUp size={16} className="text-orange-500" />
          Conversion: Views vs. Sales (Top 5)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {chartData.map((p) => {
            const viewWidth = ((p.views ?? 0) / maxVal) * 100;
            const salesWidth = ((p.total_sold ?? 0) / maxVal) * 100;

            return (
              <div key={p.id} className="group">
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span className="truncate max-w-[250px] group-hover:text-orange-600 transition-colors">{p.name}</span>
                  <span className="text-slate-400">{p.views} views</span>
                </div>
                <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-orange-100 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${viewWidth}%` }}
                  />
                  <div 
                    className="absolute h-full bg-orange-500 rounded-full transition-all duration-1000 ease-out shadow-[1px_0_3px_rgba(0,0,0,0.1)]"
                    style={{ width: `${salesWidth}%` }}
                  />
                </div>
                <div className="flex justify-end mt-1">
                   <span className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">
                    {p.total_sold} Sold
                   </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex gap-6 border-t border-slate-50 pt-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <div className="w-3 h-3 bg-orange-100 rounded-sm" /> Views
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
            <div className="w-3 h-3 bg-orange-500 rounded-sm" /> Conversions (Sales)
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Component ---
const DistributorProfile: React.FC = () => {
  const [profile, setProfile] = useState<DistributorProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [p] = await Promise.all([
          getDistributorProfile(),
          listDistributorOrders()
        ]);
        setProfile(p);
      } catch (e: any) {
        setError(e.message || 'Failed to load distributor data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const products = useMemo(() => 
    [...(profile?.products ?? [])].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)),
    [profile]
  );

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const visibleProducts = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalViews = products.reduce((acc, p) => acc + (p.views ?? 0), 0);
  const totalSold = products.reduce((acc, p) => acc + (p.total_sold ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#fcfcfd] py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-10 items-start">
        
        {/* Left Banner */}
        <aside className="hidden lg:block sticky top-10">
          <Link to="/marketplace" className="group block rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-orange-200 transition-all shadow-sm">
            <img src={banner} alt="Marketplace" className="w-full h-auto group-hover:scale-105 transition-transform duration-700" />
          </Link>
        </aside>

        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-600 rounded-2xl text-white shadow-lg shadow-orange-200">
                <LayoutDashboard size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketplace</h1>
                <p className="text-slate-500 font-medium">Distributor Insights & Performance</p>
              </div>
            </div>
            <Link to="/marketplace" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
              View Marketplace <ArrowUpRight size={16} />
            </Link>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-xl font-medium">
              {error}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard 
              icon={<Eye className="text-blue-600" />} 
              label="Total Views" 
              value={totalViews.toLocaleString()} 
              color="bg-blue-50"
            />
            <StatCard 
              icon={<ShoppingBag className="text-emerald-600" />} 
              label="Items Sold" 
              value={totalSold.toLocaleString()} 
              color="bg-emerald-50"
            />
            <StatCard 
              icon={<Package className="text-orange-600" />} 
              label="Active Orders" 
              value={profile?.orders_count ?? 0} 
              color="bg-orange-50"
            />
          </div>

          {/* Visual Analytics */}
          {!loading && products.length > 0 && (
            <ProductChart products={products} />
          )}

          {/* Table Card */}
          <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800">Inventory Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Details</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Views</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Total Sold</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={4} className="h-16 bg-slate-50/50" /></tr>)
                    ) : visibleProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">{p.name}</td>
                        <td className="px-6 py-4 text-center text-slate-500 text-sm font-medium">{p.views ?? 0}</td>
                        <td className="px-6 py-4 text-center text-slate-900 text-sm font-black">{p.total_sold ?? 0}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-black">
                            <Star size={10} className="fill-current" />
                            {typeof p.avg_rating === 'number' ? p.avg_rating.toFixed(1) : '0.0'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Rows per page</span>
                  <select 
                    value={pageSize} 
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-500">
                    Page <span className="text-slate-900">{currentPage}</span> of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      disabled={currentPage <= 1} 
                      onClick={() => setCurrentPage(c => c - 1)}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-20 transition-all shadow-sm"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button 
                      disabled={currentPage >= totalPages} 
                      onClick={() => setCurrentPage(c => c + 1)}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-white disabled:opacity-20 transition-all shadow-sm"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Banner */}
        <aside className="hidden lg:block sticky top-10">
          <Link to="/marketplace" className="group block rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-orange-200 transition-all shadow-sm">
            <img src={banner} alt="Promotions" className="w-full h-auto group-hover:scale-105 transition-transform duration-700" />
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default DistributorProfile;
