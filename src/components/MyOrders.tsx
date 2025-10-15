import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import Navbar from './Navbar';
import Footer from './Footer';

interface PaymentTransaction {
  transaction_id: string;
  order_number: string;
  amount: number;
  status: string;
  gateway: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  marketplace_sales?: Array<{
    product_name: string;
    quantity: number;
    total_amount: number;
    seller: string;
  }>;
}

const statusColors: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  processing: 'bg-blue-100 text-blue-800',
};

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Replace with your actual API endpoint
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://appmulyabazzar.com/api/v1/payments/my-orders/', {
          headers: {
            'Authorization': `Token ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const result = await response.json();
        setOrders(result.data || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">My Orders</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-700 text-sm">No orders found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow-md">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm">
                    <th className="py-3 px-4 text-left">Order #</th>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Amount</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Gateway</th>
                    <th className="py-3 px-4 text-left">Customer</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.transaction_id} className="border-b last:border-b-0 hover:bg-orange-50">
                      <td className="py-3 px-4 font-semibold">{order.order_number}</td>
                      <td className="py-3 px-4">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">Rs. {order.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status?.toLowerCase()] || 'bg-gray-200 text-gray-700'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{order.gateway}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-xs text-gray-500">{order.customer_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" className="mr-2">View</Button>
                        <Button size="sm" variant="outline">Invoice</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyOrders;
