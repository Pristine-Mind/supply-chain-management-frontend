import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { 
  CheckCircle2, 
  CreditCard, 
  Wallet, 
  ShieldCheck, 
  ChevronRight, 
  Lock,
  Zap,
  Building2,
  AlertCircle,
  Search,
  ArrowLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import Navbar from './Navbar';
import Footer from './Footer';
import { createOrder, CreateOrderRequest, DeliveryInfoRequest, OrderResponse } from '../api/orderApi';

export interface Delivery {
  id?: number;
  cartId: number;
  customer_name: string;
  phone_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PaymentGatewayItem {
  idx: string;
  name: string;
  logo: string | null;
}

interface PaymentGateway {
  slug: string;
  name: string;
  logo: string;
  items: PaymentGatewayItem[];
}

interface PaymentGatewayResponse {
  status: string;
  data: PaymentGateway[];
}

interface LocationState {
  delivery?: Delivery;
  total?: number;
  originalTotal?: number;
  couponCode?: string;
  discountAmount?: number;
}

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { state: locState } = useLocation() as { state: LocationState };
  const delivery = locState?.delivery;

  const { cart, state: cartState, clearCart, createCartOnBackend } = useCart();
  const cartId = cartState.cartId;

  // Calculate totals
  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 100; 
  const cartTotal = subTotal + shipping;

  const [method, setMethod] = useState<string>('COD');
  const [processing, setProcessing] = useState(false);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGateway, setExpandedGateway] = useState<string | null>(null);
  const [bankSearch, setBankSearch] = useState('');

  useEffect(() => {
    const fetchPaymentGateways = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('https://appmulyabazzar.com/api/v1/payments/gateways/');
        if (!response.ok) throw new Error('Failed to fetch gateways');
        const data: PaymentGatewayResponse = await response.json();
        if (data.status === 'success') {
          setPaymentGateways(data.data);
        } else {
          throw new Error('Invalid response');
        }
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message);
        setPaymentGateways([{ slug: 'KHALTI', name: 'Khalti Wallet', logo: '', items: [] }]);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentGateways();
  }, []);

  const onSuccess = async (paymentMethod: string) => {
    try {
      if (!delivery) {
        toast.error('Delivery information not found');
        return;
      }
      if (!cart || cart.length === 0) {
        toast.error('Your cart is empty.');
        return;
      }

      const orderCartId = delivery.cartId || cartId;
      if (!orderCartId) {
        toast.error('Cart not found.');
        return;
      }

      const deliveryInfo: DeliveryInfoRequest = {
        customer_name: delivery.customer_name,
        customer_email: delivery.email || '',
        phone_number: delivery.phone_number,
        address: delivery.address,
        city: delivery.city,
        state: delivery.state,
        zip_code: delivery.zip_code,
        latitude: delivery.latitude || 0,
        longitude: delivery.longitude || 0,
      };

      const orderRequest: CreateOrderRequest = {
        cart_id: orderCartId,
        delivery_info: deliveryInfo,
        payment_method: paymentMethod,
        // Include coupon code if one was applied
        ...(locState?.couponCode && { coupon_code: locState.couponCode }),
      };

      const order: OrderResponse = await createOrder(orderRequest);
      toast.success(`Order #${order.order_number} placed!`);
      clearCart();
      navigate('/payment-success', { state: { order, paymentMethod }, replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Order creation failed.');
    }
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      let backendCartId = cartId;
      if (!backendCartId) {
        backendCartId = await createCartOnBackend();
      }

      if (method === 'COD') {
        await onSuccess('Cash on Delivery');
        setProcessing(false);
        return;
      }

      let gateway = method;
      let selectedBankIdx = "";
      if (method.includes('_')) {
        const parts = method.split('_');
        gateway = parts[0];
        selectedBankIdx = parts[1];
      }
      
      const paymentData: any = {
        cart_id: backendCartId,
        gateway: method,
        customer_name: delivery?.customer_name || "Customer",
        customer_email: delivery?.email || "customer@example.com",
        customer_phone: delivery?.phone_number || "9800000001",
        tax_amount: 0,
        shipping_cost: 100,
        return_url: `${window.location.origin}/payment/success/`,
      };

      if (selectedBankIdx) {
        paymentData.bank = selectedBankIdx;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('https://appmulyabazzar.com/api/v1/payments/initiate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      if (result.payment_url) {
        window.location.href = result.payment_url;
      } else if (result.success) {
        await onSuccess(gateway);
      } else {
        throw new Error(result.message || 'Payment initiation failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-orange-500 font-bold text-xs uppercase tracking-widest transition-all">
              <ArrowLeft size={14} /> Back to details
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">
              Secure <span className="text-orange-500">Checkout</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Selection Area */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-2">Payment Methods</h2>
            
            <div className="space-y-4">
              {loading ? (
                <div className="py-20 text-center space-y-4 bg-white rounded-[2rem] border border-slate-100">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Fetching Gateways...</p>
                </div>
              ) : (
                <>
                  {paymentGateways.map((gateway) => (
                    <GatewayCard 
                      key={gateway.slug}
                      gateway={gateway}
                      isSelected={method.startsWith(gateway.slug)}
                      onSelect={() => {
                        setMethod(gateway.slug);
                        setExpandedGateway(expandedGateway === gateway.slug ? null : gateway.slug);
                      }}
                      isExpanded={expandedGateway === gateway.slug}
                      onBankSelect={(bankIdx: string) => setMethod(`${gateway.slug}_${bankIdx}`)}
                      currentMethod={method}
                      bankSearch={bankSearch}
                      setBankSearch={setBankSearch}
                    />
                  ))}

                  {/* COD Selection */}
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setMethod('COD')}
                    className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 flex items-center justify-between ${
                      method === 'COD' ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-100' : 'border-white bg-white hover:border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-[1.5rem] ${method === 'COD' ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <Zap size={24} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-tight uppercase tracking-tight">Cash on Delivery</p>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Pay at your doorstep</p>
                      </div>
                    </div>
                    {method === 'COD' && <CheckCircle2 className="text-orange-500" size={28} />}
                  </motion.div>
                </>
              )}
            </div>

            <div className="p-8 bg-orange-600 rounded-[2.5rem] text-white flex gap-5 relative overflow-hidden">
               <Lock className="text-orange-500 shrink-0 mt-1" size={20} />
               <div className="relative z-10">
                 <p className="text-xs font-bold leading-relaxed opacity-80 uppercase tracking-wide">
                   We prioritize your financial safety. Your details are processed through secure bank gateways and are never stored on our servers.
                 </p>
               </div>
               <ShieldCheck className="absolute -right-8 -bottom-8 text-white opacity-5" size={140} />
            </div>
          </div>

          {/* Right Sidebar: Receipt Style Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 overflow-hidden border border-slate-100 flex flex-col">
                <div className="bg-orange-600 p-10 text-white relative">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Building2 size={80} />
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase">Order Summary</h3>
                  <div className="flex justify-between items-center mt-3 opacity-60">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ref: MB-{cartId || 'NEW'}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="p-10 space-y-8 flex-1">
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-black uppercase tracking-widest">
                      <span className="text-slate-400">Cart Subtotal</span>
                      <span className="text-slate-900">Rs. {subTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black uppercase tracking-widest">
                      <span className="text-slate-400">Standard Delivery</span>
                      <span className="text-slate-900">Rs. {shipping.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-8 border-t-2 border-dashed border-slate-100">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-2">Grand Total</p>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter italic">Rs. {cartTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {delivery && (
                    <div className="mt-10 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex gap-5">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                        <Building2 size={20} />
                      </div>
                      <div className="text-[11px] leading-relaxed">
                        <span className="font-black text-slate-900 block uppercase tracking-widest mb-1">Shipping Details</span>
                        <span className="text-slate-600 font-bold">{delivery.customer_name}</span>
                        <p className="text-slate-400 font-bold line-clamp-1">{delivery.address}, {delivery.city}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={processing || !method}
                className="w-full bg-orange-600 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.25em] text-xs shadow-2xl shadow-slate-300 hover:bg-orange-600 transition-all duration-500 flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale"
              >
                {processing ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Complete Transaction <ChevronRight size={18} /></>
                )}
              </motion.button>
              
              {!method && (
                <div className="flex items-center justify-center gap-3 text-red-500">
                  <AlertCircle size={16} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select Payment to proceed</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const GatewayCard = ({ gateway, isSelected, onSelect, isExpanded, onBankSelect, currentMethod, bankSearch, setBankSearch }: any) => {
  const isBankType = gateway.slug === 'MOBILE_BANKING' || gateway.slug === 'EBANKING';

  return (
    <div className="group">
      <motion.div 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onSelect}
        className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 flex items-center justify-between ${
          isSelected ? 'border-orange-500 bg-orange-50/50 shadow-lg shadow-orange-100' : 'border-white bg-white hover:border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-[1.5rem] transition-all duration-300 ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
            <GatewayIcon slug={gateway.slug} />
          </div>
          <div>
            <p className="font-black text-slate-900 leading-tight uppercase tracking-tight">{gateway.name}</p>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {gateway.items?.length > 0 ? `${gateway.items.length} Secure Hubs` : 'Digital Wallet'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {gateway.logo && <img src={gateway.logo} className={`h-8 w-auto transition-all ${isSelected ? 'grayscale-0' : 'grayscale opacity-30'}`} alt={gateway.name} />}
          {isSelected && <CheckCircle2 className="text-orange-500" size={28} />}
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && isBankType && gateway.items?.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-6 bg-white border-x border-b border-orange-100 rounded-b-[2.5rem] p-8 space-y-6 shadow-inner">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text" 
                  placeholder="FIND YOUR BANK..." 
                  value={bankSearch}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-[1.2rem] py-4 pl-12 text-[10px] font-black tracking-widest focus:ring-2 focus:ring-orange-200 placeholder:text-slate-300 uppercase"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                {gateway.items
                  .filter((b: any) => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
                  .map((bank: any) => (
                    <button
                      key={bank.idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBankSelect(bank.idx);
                      }}
                      className={`flex items-center gap-4 p-4 rounded-[1.5rem] text-left transition-all border-2 ${
                        currentMethod.endsWith(bank.idx) 
                        ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-200' 
                        : 'bg-white border-slate-50 text-slate-600 hover:border-orange-100 hover:bg-orange-50/20'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white p-1.5 shrink-0 shadow-sm border border-slate-50 overflow-hidden">
                        {bank.logo ? (
                          <img src={bank.logo} className="w-full h-full object-contain" alt="" />
                        ) : (
                          <Building2 size={16} className="text-slate-200 m-auto mt-2" />
                        )}
                      </div>
                      <span className="text-[10px] font-black uppercase leading-tight line-clamp-2 tracking-tight">{bank.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GatewayIcon = ({ slug }: { slug: string }) => {
  if (slug === 'KHALTI') return <Wallet size={24} />;
  if (slug === 'MOBILE_BANKING') return <Zap size={24} />;
  if (slug === 'CONNECT_IPS' || slug === 'SCT') return <CreditCard size={24} />;
  return <Building2 size={24} />;
};

export default Payment;
