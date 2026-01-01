import React, { useEffect, useState } from 'react';
import { 
    getDistributorProfile,
    listDistributorOrders,
    DistributorProfileResponse,
    DistributorOrder
} from '../api/distributorApi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import banner from '../assets/banner_new.png';
import { Link } from 'react-router-dom';

const DistributorProfile: React.FC = () => {
  const [profile, setProfile] = useState<DistributorProfileResponse | null>(null);
  const [orders, setOrders] = useState<DistributorOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [ordersPage, setOrdersPage] = useState<number>(1);
  const [ordersPageSize, setOrdersPageSize] = useState<number>(10);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [p, o] = await Promise.all([
          getDistributorProfile(),
          listDistributorOrders()
        ]);
        setProfile(p);
        setOrders(o);
      } catch (e: any) {
        setError(e.message || 'Failed to load distributor data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const products = (profile?.products ?? []).slice().sort((a, b) => {
    if ((b.views ?? 0) !== (a.views ?? 0)) return (b.views ?? 0) - (a.views ?? 0);
    return (b.total_sold ?? 0) - (a.total_sold ?? 0);
  });
  
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const visibleProducts = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalOrderPages = Math.max(1, Math.ceil(orders.length / ordersPageSize));
  const visibleOrders = orders.slice((ordersPage - 1) * ordersPageSize, ordersPage * ordersPageSize);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    if (ordersPage > totalOrderPages && totalOrderPages > 0) {
      setOrdersPage(totalOrderPages);
    }
  }, [totalOrderPages, ordersPage]);

  return (
    <div className="w-full py-6">
      <div className="w-full grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-4 items-start px-2">
        {/* Left banner (hidden on small screens) */}
           <div className="hidden lg:flex justify-center">
             <Link to="/marketplace" aria-label="Go to marketplace" className="w-64 block rounded-lg overflow-hidden border border-neutral-200">
               <img
                 src={banner}
                 alt="Left banner"
                 className="w-full h-auto object-cover"
               />
             </Link>
           </div>

        <div className="w-full">
          {/* Product Insights Card */}
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="status-error p-4 rounded mb-4 bg-red-50 border border-red-200 text-red-800">
                  {error}
                </div>
              )}
              
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-neutral-600">Loading...</div>
                </div>
              )}

              {!loading && profile && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Product Insights</h3>
                    <div className="overflow-auto">
                      <table className="min-w-full divide-y divide-neutral-200 bg-white rounded-lg">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">Product</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-neutral-700">Views</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-neutral-700">Total Sold</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-neutral-700">Avg Rating</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {visibleProducts.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-center text-neutral-600">
                                No products found.
                              </td>
                            </tr>
                          ) : (
                            visibleProducts.map(p => (
                              <tr key={p.id} className="hover:bg-neutral-50">
                                <td className="px-4 py-3 text-sm text-neutral-800">{p.name}</td>
                                <td className="px-4 py-3 text-sm text-center text-neutral-700">{p.views ?? 0}</td>
                                <td className="px-4 py-3 text-sm text-center text-neutral-800">{p.total_sold ?? 0}</td>
                                <td className="px-4 py-3 text-sm text-center text-neutral-700">
                                  {typeof p.avg_rating === 'number' ? p.avg_rating.toFixed(1) : '0.0'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="text-sm text-neutral-600">
                        Orders containing your items: <strong>{profile.orders_count ?? 0}</strong>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-neutral-600">Rows:</label>
                          <select 
                            value={pageSize} 
                            onChange={(e) => { 
                              setPageSize(Number(e.target.value)); 
                              setCurrentPage(1); 
                            }} 
                            className="input-field w-20 px-2 py-1 border border-neutral-200 rounded text-sm"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            className="px-3 py-1 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed" 
                            disabled={currentPage <= 1} 
                            onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                          >
                            Prev
                          </button>
                          <span className="text-sm text-neutral-600">
                            Page {currentPage} / {totalPages}
                          </span>
                          <button 
                            className="px-3 py-1 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed" 
                            disabled={currentPage >= totalPages} 
                            onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

           <div className="hidden lg:flex justify-center">
             <Link to="/marketplace" aria-label="Go to marketplace" className="w-64 block rounded-lg overflow-hidden border border-neutral-200">
               <img
                 src={banner}
                 alt="Right banner"
                 className="w-full h-auto object-cover"
               />
             </Link>
           </div>
      </div>
    </div>
  );
};

export default DistributorProfile;
