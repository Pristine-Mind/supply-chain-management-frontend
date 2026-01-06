import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  CheckCircle2, 
  ShoppingBag, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Package, 
  ChevronRight, 
  Printer,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { OrderResponse } from '../api/orderApi';

interface LocationState {
  order?: OrderResponse;
  paymentMethod?: string;
}

function useQuery() {
  return new URLSearchParams(window.location.search);
}

const PaymentSuccess: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const { state: locState } = useLocation() as { state?: LocationState };
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | 'pending'>('pending');
  const [message, setMessage] = useState('');

  const order = locState?.order;
  const paymentMethod = locState?.paymentMethod;

  useEffect(() => {
    setLoading(false);
    if (order) {
      setStatus('success');
      setMessage('Your order has been placed successfully!');
      toast.success('Order placed successfully!');
    } else {
      setStatus('success');
      let msg = 'Payment completed successfully!';
      msg += `\nTransaction ID: ${query.get('transaction_id') || query.get('pidx') || '-'}`;
      msg += `\nOrder ID: ${query.get('purchase_order_id') || '-'}`;
      const amount = query.get('amount') || query.get('total_amount');
      const formattedAmount = amount ? `Rs. ${(parseFloat(amount) / 100).toFixed(2)}` : '-';
      msg += `\nAmount: ${formattedAmount}`;
      setMessage(msg);
      toast.success('Payment completed successfully!');
    }
  }, [order, query]);

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
                    #{order?.order_number || query.get('purchase_order_id') || 'N/A'}
                  </h2>
                </div>
                <div className="flex gap-3">
                  <button className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors" title="Print Receipt">
                    <Printer size={20} />
                  </button>
                  <div className="h-12 w-px bg-white/20 hidden md:block" />
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Transaction Date</p>
                    <p className="font-bold text-sm">{order ? formatDate(order.created_at) : new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-10">
                {order ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-orange-500">
                          <Package size={18} />
                          <h3 className="text-xs font-black uppercase tracking-widest">Order Details</h3>
                        </div>
                        <div className="space-y-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                           <div className="flex justify-between text-sm">
                             <span className="text-slate-400 font-bold">Status</span>
                             <span className="text-emerald-600 font-black uppercase text-xs tracking-wider bg-emerald-50 px-3 py-1 rounded-full">{order.status}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span className="text-slate-400 font-bold">Payment</span>
                             <span className="text-slate-900 font-black">{paymentMethod || 'Completed'}</span>
                           </div>
                           <div className="flex justify-between text-lg pt-2 border-t border-slate-200">
                             <span className="text-slate-900 font-black tracking-tight italic uppercase">Total</span>
                             <span className="text-slate-900 font-black">Rs. {order.total_amount.toLocaleString()}</span>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-orange-500">
                          <MapPin size={18} />
                          <h3 className="text-xs font-black uppercase tracking-widest">Delivery Address</h3>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                          <p className="font-black text-slate-900 uppercase text-xs tracking-tight mb-2">{order.delivery_info.customer_name}</p>
                          <p className="text-slate-500 font-bold text-xs leading-relaxed">
                            {order.delivery_info.address}, {order.delivery_info.city}<br/>
                            {order.delivery_info.state}, {order.delivery_info.zip_code}
                          </p>
                          <div className="mt-4 flex items-center gap-2 text-slate-400">
                             <Smartphone size={14} />
                             <span className="text-xs font-bold">{order.delivery_info.phone_number}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Shipment Contents</h3>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-orange-200 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">
                                {item.quantity}x
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 tracking-tight uppercase">{item.product_name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rs. {item.price} per unit</p>
                              </div>
                            </div>
                            <p className="font-black text-slate-900 text-sm italic">Rs. {item.total}</p>
                          </div>
                        ))}
                      </div>
                    </div>
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
