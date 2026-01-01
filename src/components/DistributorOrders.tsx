import React, { useEffect, useState, useMemo } from 'react';
import { listDistributorOrders, fetchDistributorOrderInvoice, DistributorOrder } from '../api/distributorApi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const DistributorOrders: React.FC = () => {
  const [orders, setOrders] = useState<DistributorOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const o = await listDistributorOrders();
        setOrders(o);
      } catch (e: any) {
        setError(e.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadInvoice = async (orderId: number, orderNumber: string) => {
    setInvoiceLoading(orderId);
    try {
      const res = await fetchDistributorOrderInvoice(orderId);
      if (res instanceof Blob) {
        const url = window.URL.createObjectURL(res);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${orderNumber || 'invoice'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else if ((res as any).message) {
        alert((res as any).message);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to download invoice');
    } finally {
      setInvoiceLoading(null);
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        o =>
          o.order_number?.toLowerCase().includes(query) ||
          o.customer?.toLowerCase().includes(query) ||
          o.seller_items?.some(item => item.product_name?.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.order_status === statusFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(o => o.payment_status === paymentFilter);
    }

    return filtered;
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, paymentFilter, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const statusOptions = useMemo(() => {
    const statuses = new Set(orders.map(o => o.order_status).filter(Boolean));
    return Array.from(statuses);
  }, [orders]);

  const paymentOptions = useMemo(() => {
    const payments = new Set(orders.map(o => o.payment_status).filter(Boolean));
    return Array.from(payments);
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => {
      const sellerTotal = order.seller_items?.reduce(
        (itemSum, item) => itemSum + (item.total_price ?? 0),
        0
      ) ?? 0;
      return sum + sellerTotal;
    }, 0);
  }, [filteredOrders]);

  return (
    <div className="w-full py-6">
      <div className="w-full px-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Marketplace Orders</CardTitle>
              <div className="flex items-center gap-4">
                <div className="text-sm text-neutral-600">
                  Total Orders: <strong>{filteredOrders.length}</strong>
                </div>
                <div className="text-sm text-neutral-600">
                  Revenue: <strong>Rs.{totalRevenue.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="status-error p-4 rounded mb-4 bg-red-50 border border-red-200 text-red-800">
                {error}
              </div>
            )}

            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm text-neutral-600 mb-1 block">Search</label>
                <input
                  type="text"
                  placeholder="Search by order #, customer, or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-neutral-600 mb-1 block">Order Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-neutral-600 mb-1 block">Payment Status</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Payments</option>
                  {paymentOptions.map(payment => (
                    <option key={payment} value={payment}>{payment}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-neutral-600">Loading orders...</div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-neutral-600">
                {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'No orders match your filters.'
                  : 'No orders found containing your items.'}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {visibleOrders.map(o => {
                    const sellerTotal = o.seller_items?.reduce(
                      (sum, item) => sum + (item.total_price ?? 0),
                      0
                    ) ?? 0;

                    return (
                      <div
                        key={o.id}
                        className="p-4 border border-neutral-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                              <div className="font-semibold text-lg text-neutral-800">
                                {o.order_number || `Order #${o.id}`}
                              </div>
                              <div className="text-sm text-neutral-500">
                                {o.created_at
                                  ? new Date(o.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'N/A'}
                              </div>
                            </div>

                            <div className="mb-3">
                              <span className="text-sm text-neutral-600">Customer: </span>
                              <span className="text-sm font-medium text-neutral-800">
                                {o.customer || 'Guest'}
                              </span>
                            </div>

                            <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
                              <div className="text-xs font-medium text-neutral-600 uppercase mb-2">
                                Your Items ({o.seller_items?.length ?? 0})
                              </div>
                              {o.seller_items && o.seller_items.length > 0 ? (
                                o.seller_items.map(it => (
                                  <div
                                    key={it.id}
                                    className="flex items-center justify-between py-1 text-sm"
                                  >
                                    <div className="flex-1 min-w-0 mr-4">
                                      <span className="text-neutral-700">
                                        {it.product_name || 'Unknown Product'}
                                      </span>
                                      <span className="text-neutral-500 ml-2">
                                        × {it.quantity ?? 0}
                                      </span>
                                      <span className="text-neutral-400 ml-2 text-xs">
                                        @ ${(it.unit_price ?? 0).toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="font-medium text-neutral-800">
                                      ${(it.total_price ?? 0).toFixed(2)}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-neutral-500">No items</div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 lg:items-end lg:min-w-[200px]">
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                {o.order_status || 'pending'}
                              </span>
                              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                {o.payment_status || 'pending'}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="text-sm text-neutral-600 lg:text-right">
                                Your Subtotal:{' '}
                                <span className="font-semibold text-neutral-800">
                                  ${sellerTotal.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-xs text-neutral-500 lg:text-right">
                                Order Total: ${(o.total_amount ?? 0).toFixed(2)}
                              </div>
                            </div>

                            <div className="flex gap-2 lg:flex-col">
                              <Button size="sm" variant="outline" asChild className="flex-1 lg:w-full">
                                <a href={`/orders/${o.id}`}>View Details</a>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDownloadInvoice(o.id, o.order_number)}
                                disabled={invoiceLoading !== null}
                                className="flex-1 lg:w-full"
                              >
                                {invoiceLoading === o.id ? 'Preparing...' : 'Download Invoice'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm text-neutral-600">
                    Showing {visibleOrders.length} of {filteredOrders.length} orders
                    {filteredOrders.length !== orders.length && (
                      <span className="text-neutral-400"> (filtered from {orders.length})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-neutral-600">Per page:</label>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(1)}
                      >
                        First
                      </button>
                      <button
                        className="px-3 py-1 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                      >
                        Prev
                      </button>
                      <span className="text-sm text-neutral-600 px-2">
                        Page {currentPage} / {totalPages}
                      </span>
                      <button
                        className="px-3 py-1 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                      >
                        Next
                      </button>
                      <button
                        className="px-3 py-1 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DistributorOrders;
