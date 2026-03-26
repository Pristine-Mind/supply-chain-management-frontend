import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  CheckCircle2, 
  ShoppingBag, 
  MapPin, 
  Calendar, 
  Package, 
  ChevronRight, 
  Printer,
  Smartphone,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { OrderResponse } from '../api/orderApi';
import { useCart } from '../context/CartContext';
import { fetchMarketplaceOrderById, MarketplaceOrder } from '../api/marketplaceOrderApi';

interface LocationState {
  order?: OrderResponse;
  paymentMethod?: string;
  delivery?: any;
  cartId?: number;
}

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

const PaymentSuccess: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const { state: locState } = useLocation() as { state?: LocationState };
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | 'pending'>('pending');
  const [message, setMessage] = useState('');
  const [orderData, setOrderData] = useState<OrderResponse | MarketplaceOrder | null>(null);
  const [verifyResponse, setVerifyResponse] = useState<any>(null);

  const order = locState?.order;
  const paymentMethod = locState?.paymentMethod;

  useEffect(() => {
    const handlePaymentReturn = async () => {
      try {
        setLoading(true);
        const authToken = localStorage.getItem('token');

        // --- 1. Read Khalti callback params from return_url ---
        const pidx         = query.get('pidx');
        const khaltiStatus = query.get('status'); // Completed | Pending | User canceled | Expired | Failed

        console.log('[PaymentSuccess] URL params:', { pidx, khaltiStatus });

        // --- 2. Internal flow (COD / non-redirect): no Khalti params means non-gateway payment ---
        if (!pidx && !khaltiStatus) {
          console.log('[PaymentSuccess] COD / internal flow');
          setStatus('success');
          if (order) setOrderData(order);
          setMessage('Your order has been placed successfully!');
          toast.success('Order placed successfully!');
          clearCart();
          setLoading(false);
          return;
        }

        // --- 3. Reject cancelled / failed payments immediately ---
        if (khaltiStatus && khaltiStatus.toLowerCase() !== 'completed') {
          const friendlyMsg =
            khaltiStatus.toLowerCase() === 'user canceled'
              ? 'Payment was cancelled. Please try again.'
              : `Payment ${khaltiStatus}. Please try again or contact support.`;
          console.warn('[PaymentSuccess] Payment not completed:', khaltiStatus);
          setStatus('error');
          setMessage(friendlyMsg);
          toast.error(friendlyMsg);
          setLoading(false);
          return;
        }

        // --- 4. pidx is required ---
        if (!pidx) {
          console.error('[PaymentSuccess] Missing pidx:', { pidx });
          setStatus('error');
          setMessage('Missing payment identifier. Please contact support if the amount was deducted.');
          setLoading(false);
          return;
        }

        // --- 5. Retrieve pending order info saved before Khalti redirect ---
        let pendingOrder: { transactionId?: string; cartId?: string | number } | null = null;
        try {
          const raw = localStorage.getItem('pendingOrder');
          if (raw) pendingOrder = JSON.parse(raw);
        } catch { /* ignore */ }

        // Send pidx + our internal transaction_id (as reference) so backend can find the PaymentTransaction
        const verifyPayload: Record<string, string> = { pidx };
        if (pendingOrder?.transactionId) {
          verifyPayload.reference = pendingOrder.transactionId;
        }

        console.log('[PaymentSuccess] Calling /api/v1/payments/verify with:', verifyPayload);

        // --- 6. Verify with backend ---
        const verifyRes = await fetch(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/payments/verify/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken && { 'Authorization': `Token ${authToken}` }),
            },
            body: JSON.stringify(verifyPayload),
          }
        );

        console.log('[PaymentSuccess] /payments/verify/ status:', verifyRes.status);

        const resData = await verifyRes.json().catch(() => ({})) as any;
        console.log('[PaymentSuccess] /payments/verify/ response:', resData);

        if (!verifyRes.ok || resData.status !== 'success') {
          throw new Error(resData.message || 'Payment verification failed. Please contact support.');
        }

        const verifiedData = resData.data || {};
        const marketplaceOrderId = verifiedData.marketplace_order?.id;

        // Store complete verify response for display
        setVerifyResponse({
          ...verifiedData,
          status: resData.payment_status,
        });

        // --- 7. Fetch full marketplace order to populate order details on screen ---
        let fullOrderData: MarketplaceOrder | null = null;
        if (marketplaceOrderId) {
          console.log('[PaymentSuccess] Fetching full marketplace order:', marketplaceOrderId);
          try {
            fullOrderData = await fetchMarketplaceOrderById(marketplaceOrderId);
            console.log('[PaymentSuccess] Full marketplace order:', fullOrderData);
          } catch (err: any) {
            console.warn('[PaymentSuccess] Failed to fetch full marketplace order:', err.message);
            // Non-critical — we already have basic order info from verify response
          }
        } else if (verifiedData.order_number) {
          // Fallback: verify endpoint should ideally return marketplace_order.id
          console.warn('[PaymentSuccess] marketplace_order.id not found, verify response may be incomplete');
        }

        // --- 8. Cleanup and show success ---
        localStorage.removeItem('pendingOrder');
        setStatus('success');
        setMessage(
          `Payment verified! Order #${fullOrderData?.order_number || verifiedData.order_number || ''} confirmed.`
        );
        // Set full order data if available, otherwise use location state order
        if (fullOrderData) {
          setOrderData(fullOrderData);
        } else if (order) {
          setOrderData(order);
        }
        toast.success('Payment verified successfully!');
        clearCart();
        setLoading(false);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'An error occurred. Please contact support if the amount was deducted.');
        toast.error(error.message || 'Error');
        setLoading(false);
      }
    };

    handlePaymentReturn();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] shadow-sm border border-slate-100">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Finalizing Order...</p>
          </div>
        ) : status === 'success' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200"
              >
                <CheckCircle2 size={48} />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
                Order <span className="text-emerald-500">Confirmed</span>
              </h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                Check your email for the digital receipt and tracking info.
              </p>
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 relative">
              <div className="bg-slate-900 p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-2">Order Reference</p>
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                    #{orderData?.order_number || query.get('purchase_order_id') || 'N/A'}
                  </h2>
                </div>
                <div className="flex gap-3">
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors" title="Print Receipt">
                    <Printer size={20} />
                  </button>
                  <div className="h-12 w-px bg-white/20 hidden md:block" />
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Transaction Date</p>
                    <p className="font-bold text-sm">{orderData ? formatDate(orderData.created_at) : new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-10">
                {orderData ? (
                  <>
                    {/* Payment Transaction Details */}
                    {verifyResponse && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-orange-500">
                          <CreditCard size={18} />
                          <h3 className="text-xs font-black uppercase tracking-widest">Payment Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400 font-bold">Payment ID</span>
                              <span className="text-slate-900 font-black text-[10px] font-mono break-all">{verifyResponse.transaction_id || verifyResponse.payment_transaction_id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400 font-bold">Gateway</span>
                              <span className="text-slate-900 font-black uppercase text-[10px] bg-orange-50 px-3 py-1 rounded-full">
                                {verifyResponse.gateway || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400 font-bold">Amount</span>
                              <span className="text-slate-900 font-black">Rs. {verifyResponse.amount ? parseFloat(verifyResponse.amount).toLocaleString() : '0'}</span>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400 font-bold">Transaction Date</span>
                              <span className="text-slate-900 font-black text-[10px]">
                                {verifyResponse.created_at ? new Date(verifyResponse.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400 font-bold">Status</span>
                              <span className="text-emerald-600 font-black uppercase text-[10px] bg-emerald-50 px-3 py-1 rounded-full">
                                {verifyResponse.status || 'Completed'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400 font-bold">Confirmed At</span>
                              <span className="text-slate-900 font-black text-[10px]">
                                {verifyResponse.completed_at ? new Date(verifyResponse.completed_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Marketplace Order Information */}
                    {verifyResponse?.marketplace_order && (
                      <div className="bg-orange-50 border border-orange-200 rounded-[2rem] p-6 space-y-4">
                        <div className="flex items-center gap-3 text-orange-600">
                          <ShoppingBag size={18} />
                          <h3 className="text-xs font-black uppercase tracking-widest">Marketplace Order</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Order #</p>
                            <p className="text-sm font-black text-slate-900">{verifyResponse.marketplace_order.order_number}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Order Status</p>
                            <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                              {verifyResponse.marketplace_order.order_status}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Payment Status</p>
                            <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                              {verifyResponse.marketplace_order.payment_status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Marketplace Order Information */}
                    {verifyResponse?.marketplace_order && (
                      <div className="bg-orange-50 border border-orange-200 rounded-[2rem] p-6 space-y-4">
                        <div className="flex items-center gap-3 text-orange-600">
                          <ShoppingBag size={18} />
                          <h3 className="text-xs font-black uppercase tracking-widest">Marketplace Order</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Order #</p>
                            <p className="text-sm font-black text-slate-900">{verifyResponse.marketplace_order.order_number}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Order Status</p>
                            <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                              {verifyResponse.marketplace_order.order_status}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Payment Status</p>
                            <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                              {verifyResponse.marketplace_order.payment_status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-orange-500">
                          <Package size={18} />
                          <h3 className="text-xs font-black uppercase tracking-widest">Order Details</h3>
                        </div>
                        <div className="space-y-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                           <div className="flex justify-between text-sm">
                             <span className="text-slate-400 font-bold">Status</span>
                             <span className="text-emerald-600 font-black uppercase text-xs tracking-wider bg-emerald-50 px-3 py-1 rounded-full">
                               {(orderData as any).status || (orderData as any).order_status_display || (orderData as any).order_status || 'Confirmed'}
                             </span>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span className="text-slate-400 font-bold">Payment</span>
                             <span className="text-slate-900 font-black">
                               {(orderData as any).payment_method || (orderData as any).payment_status_display || paymentMethod || 'Completed'}
                             </span>
                           </div>
                           <div className="flex justify-between text-lg pt-2 border-t border-slate-200">
                             <span className="text-slate-900 font-black tracking-tight italic uppercase">Total</span>
                             <span className="text-slate-900 font-black">
                               Rs. {typeof (orderData as any).total_amount === 'string' 
                                 ? parseFloat((orderData as any).total_amount).toLocaleString()
                                 : (orderData as any).total_amount.toLocaleString()}
                             </span>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-orange-500">
                          <MapPin size={18} />
                          <h3 className="text-xs font-black uppercase tracking-widest">Delivery Address</h3>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                          {(() => {
                            const delivery = (orderData as any).delivery_info || (orderData as any).delivery;
                            if (!delivery) return <p className="text-slate-400">No delivery info available</p>;
                            return (
                              <>
                                <p className="font-black text-slate-900 uppercase text-xs tracking-tight mb-2">
                                  {delivery.customer_name || delivery.recipient_name || 'N/A'}
                                </p>
                                <p className="text-slate-500 font-bold text-xs leading-relaxed">
                                  {delivery.address}, {delivery.city}<br/>
                                  {delivery.state}, {delivery.zip_code || delivery.postal_code}
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-slate-400">
                                   <Smartphone size={14} />
                                   <span className="text-xs font-bold">{delivery.phone_number}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Shipment Contents</h3>
                      <div className="space-y-2">
                        {((orderData as any).items || []).map((item: any, idx: number) => {
                          // Handle both OrderResponse and MarketplaceOrder item structures
                          const productName = item.product_name || item.product?.product_details?.name || 'Unknown Product';
                          const quantity = item.quantity || 1;
                          const unitPrice = item.price || item.unit_price || '0';
                          const totalPrice = item.total || item.total_price || '0';
                          
                          const unitPriceNum = typeof unitPrice === 'string' ? parseFloat(unitPrice) : unitPrice;
                          const totalPriceNum = typeof totalPrice === 'string' ? parseFloat(totalPrice) : totalPrice;

                          return (
                            <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-orange-200 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">
                                  {quantity}x
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900 tracking-tight uppercase">{productName}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rs. {unitPriceNum.toLocaleString()} per unit</p>
                                </div>
                              </div>
                              <p className="font-black text-slate-900 text-sm italic">Rs. {totalPriceNum.toLocaleString()}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Marketplace Sales (Legacy) */}
                    {verifyResponse?.marketplace_sales && verifyResponse.marketplace_sales.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Seller Breakdown</h3>
                        <div className="space-y-3">
                          {verifyResponse.marketplace_sales.map((sale: any, idx: number) => (
                            <div key={idx} className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-[2rem]">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Order #{sale.order_number}</p>
                                  <p className="text-[10px] text-slate-500 font-bold mt-1">Seller: {sale.seller}</p>
                                </div>
                                <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full">
                                  {sale.quantity} item{sale.quantity !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] text-slate-600 font-bold">{sale.product_name}</p>
                                <p className="font-black text-slate-900 italic">Rs. {parseFloat(sale.total_amount).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <pre className="text-slate-600 font-bold text-xs uppercase tracking-widest leading-loose whitespace-pre-wrap">
                      {message}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {[
                     { icon: <Package size={20} />, title: "Live Tracking", desc: "Available soon" },
                     { icon: <Calendar size={20} />, title: "24h Processing", desc: "Fast handling" },
                     { icon: <ExternalLink size={20} />, title: "Support Hub", desc: "Help is here" }
                   ].map((item, i) => (
                     <div key={i} className="p-5 border border-slate-100 rounded-[2rem] flex flex-col items-center text-center gap-2">
                        <div className="text-orange-500">{item.icon}</div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{item.title}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{item.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-12">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/my-orders')}
                className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-orange-600 transition-all duration-300"
              >
                <ShoppingBag size={16} /> Track My Order
              </motion.button>
              
              <button
                onClick={() => navigate('/marketplace')}
                className="w-full md:w-auto px-10 py-5 bg-white text-slate-900 border-2 border-slate-900/5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
              >
                Marketplace <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-red-50 space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto">
              <span className="text-4xl font-black">!</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Order Processing Failed</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest max-w-sm mx-auto">
              {message || "We couldn't verify your transaction. Please contact support if the amount was deducted."}
            </p>
            <button
              className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px]"
              onClick={() => navigate('/cart')}
            >
              Return to Cart
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
