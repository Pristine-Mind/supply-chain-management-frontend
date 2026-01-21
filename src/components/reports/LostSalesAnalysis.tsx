import React, { useState, useEffect } from 'react';
import { TrendingDown, AlertCircle, Package, DollarSign } from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';

interface LostSaleItem {
  id: number;
  product_name: string;
  avg_daily_demand: number;
  days_out_of_stock: number;
  price: number;
  lost_revenue: number;
}

const LostSalesAnalysis: React.FC = () => {
  const [data, setData] = useState<LostSaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await reportsApi.getLostSales();
        setData(data);
      } catch (error) {
        console.error('Error fetching lost sales analysis:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const safeData = Array.isArray(data) ? data : [];
  const totalLostRevenue = safeData.reduce((sum, item) => sum + (item?.lost_revenue || 0), 0);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lost Sales Analysis</h2>
          <p className="text-gray-500">Revenue impact of stockouts and inventory delays.</p>
        </div>
        <div className="px-6 py-4 bg-red-50 border border-red-100 rounded-2xl text-right">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Total Revenue Impact</p>
          <p className="text-2xl font-bold text-red-600">Rs.{totalLostRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Out of Stock Items</p>
              <p className="text-2xl font-bold text-gray-900">{safeData.length}</p>
            </div>
          </div>
        </div>
        {/* More stats could go here */}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">High Impact Stockouts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Daily Demand</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Days OOS</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Lost Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {safeData.map((item) => (
                <tr key={item?.id} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Package className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="font-medium text-gray-900">{item?.product_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{item?.avg_daily_demand?.toFixed(1)} units</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-red-600 font-bold">{item?.days_out_of_stock} days</span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">${item?.lost_revenue?.toLocaleString()}</td>
                </tr>
              ))}
              {safeData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Excellent! No stockouts detected affecting sales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LostSalesAnalysis;
