import React, { useEffect, useState } from 'react';
import { fetchPurchaseOrders, PurchaseOrder } from '../api/purchaseOrderApi';
import { ClipboardListIcon, CheckCircleIcon, XCircleIcon, TruckIcon } from '@heroicons/react/solid';

interface PurchaseOrderCardsProps {
  pageSize?: number;
}

const PurchaseOrderCards: React.FC<PurchaseOrderCardsProps> = ({ pageSize = 6 }) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        setLoading(false);
        return;
      }
      try {
        const offset = (page - 1) * pageSize;
        const res = await fetchPurchaseOrders(token, pageSize, offset);
        setOrders(res.results);
        setCount(res.count);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page, pageSize]);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading purchase orders...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 w-full p-4">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Purchase Orders</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-lg p-5 flex flex-col space-y-3 border border-gray-200 transition-transform transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ClipboardListIcon className="h-6 w-6 text-blue-500" />
                <span className="font-bold text-lg">Order #{order.id}</span>
              </div>
              {order.approved ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" title="Approved" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-yellow-500" title="Not Approved" />
              )}
            </div>
            <div>
              <span className="font-semibold">Product:</span> {order.product_details.name}
            </div>
            <div>
              <span className="font-semibold">Category:</span> {order.product_details.category_details}
            </div>
            <div>
              <span className="font-semibold">Quantity:</span> {order.quantity}
            </div>
            <div>
              <span className="font-semibold">Price:</span> NPR {order.product_details.price}
            </div>
            <div>
              <span className="font-semibold">Created At:</span> {new Date(order.created_at).toLocaleString()}
            </div>
            <div className="flex items-center space-x-2">
              <TruckIcon className="h-5 w-5 text-gray-400" />
              <span>{order.sent_to_vendor ? 'Sent to Vendor' : 'Not Sent'}</span>
            </div>
            <div className="text-xs text-gray-400">SKU: {order.product_details.sku}</div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-6 space-x-4">
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${page === 1 ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="text-neutral-700 font-medium">
          Page {page} of {Math.ceil(count / pageSize) || 1}
        </span>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${page >= Math.ceil(count / pageSize) ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= Math.ceil(count / pageSize)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PurchaseOrderCards;
