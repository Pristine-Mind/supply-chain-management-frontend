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
        console.log(res);
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

  if (loading) return <div>Loading purchase orders...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-lg shadow p-5 flex flex-col space-y-3 border border-gray-100">
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
      <div className="flex justify-between items-center mt-6">
        <button
          className="px-3 py-1 border rounded mr-2 disabled:opacity-50"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.ceil(count / pageSize) || 1}
        </span>
        <button
          className="px-3 py-1 border rounded ml-2 disabled:opacity-50"
          onClick={() => setPage(p => p + 1)}
          disabled={page >= Math.ceil(count / pageSize)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PurchaseOrderCards;
