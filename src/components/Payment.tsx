import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaArrowLeft, FaCheckCircle, FaCreditCard, FaWallet, FaMoneyBillWave } from 'react-icons/fa';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import Modal from 'react-modal';
import KhaltiService from '../core/services/khaltiService';
import { toast } from 'react-toastify';
import Navbar from './Navbar';
import Footer from './Footer';

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
}

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { state: locState } = useLocation() as { state: LocationState };
  const delivery = locState?.delivery;
  const total = locState?.total ?? 0;

  const { subTotal, shipping, total: cartTotal, clearCart, state, createCartOnBackend } = useCart();
  const cartId = state.cartId;
  console.log(cartId);

  const [method, setMethod] = useState<string>('COD');
  const [processing, setProcessing] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<PaymentGatewayItem | null>(null);
  const [expandedGateway, setExpandedGateway] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState({ number:'', expiry:'', cvv:'' });
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment gateways on component mount
  useEffect(() => {
    const fetchPaymentGateways = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://3.110.179.122:8000/api/v1/payments/gateways/');
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment gateways');
        }
        
        const data: PaymentGatewayResponse = await response.json();
        
        if (data.status === 'success') {
          const codGateway: PaymentGateway = {
            slug: 'COD',
            name: 'Cash on Delivery',
            logo: '',
            items: []
          };
          console.log('Fetched payment gateways:', data.data);
          setPaymentGateways([codGateway, ...data.data]);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err: any) {
        console.error('Error fetching payment gateways:', err);
        setError(err.message);
        const fallbackGateways: PaymentGateway[] = [
          { slug: 'COD', name: 'Cash on Delivery', logo: '', items: [] },
          { slug: 'KHALTI', name: 'Khalti Wallet', logo: 'https://khalti-static.s3.ap-south-1.amazonaws.com/media/kpg/wallet.svg', items: [] }
        ];
        setPaymentGateways(fallbackGateways);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentGateways();
  }, []);

  const delay = (ms:number) => new Promise(res=>setTimeout(res,ms));

  const onSuccess = (m: string) => {
    toast.success(`Payment successful with ${m}!`);
    clearCart();
    navigate('/marketplace', { replace: true });
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      let backendCartId = cartId;
      if (!backendCartId) {
        try {
          backendCartId = await createCartOnBackend();
        } catch (error) {
          toast.error('Failed to create cart. Please try again.');
          setProcessing(false);
          return;
        }
      }

      const gateway = method.includes('_') ? method.split('_')[0] : method;
      const bank = method.includes('_') ? method.split('_')[1] : null;
      
      const paymentData = {
        cart_id: backendCartId,
        gateway: gateway,
        bank: bank,
        customer_name: delivery?.customer_name || "Customer",
        customer_email: delivery?.email || "customer@example.com",
        customer_phone: delivery?.phone_number || "9800000001",
        tax_amount: 0,
        shipping_cost: 0,
        return_url: `${window.location.origin}/payment/success/`,
      };

      const token = localStorage.getItem('token');
      const response = await fetch('http://3.110.179.122:8000/api/v1/payments/initiate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`Payment initiation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.payment_url) {
        window.location.href = result.payment_url;
      } else if (result.success) {
        onSuccess(paymentData.gateway);
      } else {
        throw new Error(result.message || 'Payment initiation failed');
      }

      if (method === 'SCT' || method === 'CONNECT_IPS') {
        setCardModalOpen(true);
        setProcessing(false);
        return;
      }
      
      if ((method === 'MOBILE_BANKING' || method === 'EBANKING') && !method.includes('_')) {
        toast.error('Please select a bank first');
        setProcessing(false);
        return;
      }

    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
      setProcessing(false);
    }
  };

  const handleBankSelection = async (bank: PaymentGatewayItem) => {
    setSelectedBank(bank);
    setBankModalOpen(false);
    setProcessing(true);
    
    try {
      const selectedGateway = paymentGateways.find(gateway => gateway.slug === method);
      const gatewayName = selectedGateway?.name || method;
      
      console.log('Selected bank:', bank);
      console.log('Payment method:', method);
      
      await delay(1500);
      return onSuccess(`${gatewayName} - ${bank.name}`);
    } catch (err: any) {
      toast.error(err.message);
      setProcessing(false);
    }
  };

  const getPaymentIcon = (slug: string) => {
    switch (slug) {
      case 'COD':
        return <FaMoneyBillWave className="text-green-600 text-xl" />;
      case 'KHALTI':
        return <FaWallet className="text-purple-600 text-xl" />;
      case 'SCT':
      case 'EBANKING':
      case 'CONNECT_IPS':
        return <FaCreditCard className="text-blue-600 text-xl" />;
      case 'MOBILE_BANKING':
        return <FaWallet className="text-orange-600 text-xl" />;
      default:
        return <FaCreditCard className="text-gray-600 text-xl" />;
    }
  };

  const getPaymentDescription = (slug: string, name: string, gateway?: PaymentGateway) => {
    const bankCount = gateway?.items?.length || 0;
    
    switch (slug) {
      case 'COD':
        return 'Pay when your order arrives';
      case 'KHALTI':
        return 'Digital wallet payment';
      case 'SCT':
        return 'Secure card payment';
      case 'EBANKING':
        return bankCount > 0 ? `${bankCount} banks available` : 'Online banking payment';
      case 'CONNECT_IPS':
        return 'Connect IPS payment';
      case 'MOBILE_BANKING':
        return bankCount > 0 ? `${bankCount} banks available` : 'Mobile banking payment';
      default:
        return `Pay with ${name}`;
    }
  };

  return (
    <>  
    <Navbar/>
    <div className="min-h-screen bg-gray-50 pt-20 md:pt-10 pb-10">
      <div className="w-4/5 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <div className="bg-white shadow-lg rounded-2xl p-6">
              <h2 className="font-semibold text-gray-900 mb-6 text-xl">Choose Payment Method</h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-600 text-sm">{error}</p>
                  <p className="text-red-500 text-xs mt-1">Using fallback payment methods</p>
                </div>
              ) : null}
              <div className="space-y-3">
              {paymentGateways.map((gateway) => {
                const isSelected = method === gateway.slug;
                return (
                  <motion.div
                    key={gateway.slug}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Payment method clicked:', gateway.slug);
                      
                      if ((gateway.slug === 'MOBILE_BANKING' || gateway.slug === 'EBANKING') && gateway.items && gateway.items.length > 0) {
                        if (expandedGateway === gateway.slug) {
                          setExpandedGateway(null);
                        } else {
                          setExpandedGateway(gateway.slug);
                        }
                        return;
                      }
                      
                      setMethod(gateway.slug);
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`relative p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {gateway.logo ? (
                          <img 
                            src={gateway.logo} 
                            alt={gateway.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={gateway.logo ? 'hidden' : ''}>
                          {getPaymentIcon(gateway.slug)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{gateway.name}</div>
                          <div className="text-sm text-gray-500">
                            {getPaymentDescription(gateway.slug, gateway.name, gateway)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
                          >
                            <FaCheckCircle className="text-white text-xs" />
                          </motion.div>
                        )}
                        {(gateway.slug === 'MOBILE_BANKING' || gateway.slug === 'EBANKING') && gateway.items && gateway.items.length > 0 && (
                          <motion.div
                            animate={{ rotate: expandedGateway === gateway.slug ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-gray-400"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    
                    {expandedGateway === gateway.slug && gateway.items && gateway.items.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3 pl-8 space-y-2 border-t border-gray-100 pt-3"
                      >
                        {gateway.items.map((bank) => (
                          <div
                            key={bank.idx}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMethod(`${gateway.slug}_${bank.idx}`);
                              setSelectedBank(bank);
                              console.log('Bank selected:', bank.name);
                            }}
                            className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              method === `${gateway.slug}_${bank.idx}`
                                ? 'bg-orange-100 border border-orange-300'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {bank.logo ? (
                              <img 
                                src={bank.logo} 
                                alt={bank.name}
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {bank.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{bank.name}</div>
                            </div>
                            {method === `${gateway.slug}_${bank.idx}` && (
                              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                <FaCheckCircle className="text-white text-xs" />
                              </div>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-xs text-green-700">
                    Your payment information is secure and encrypted
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Order Summary & Delivery Details (1/3 width on large screens) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Order Summary */}
            <div className="bg-white shadow-lg rounded-2xl p-6">
              <h2 className="font-semibold text-gray-900 mb-4 text-xl">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Rs. {subTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>Rs. {shipping.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between font-semibold text-lg text-gray-900">
                    <span>Total Amount</span>
                    <span>Rs. {cartTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white shadow-lg rounded-2xl p-6">
              <h2 className="font-semibold text-gray-900 mb-4 text-xl">Delivery Address</h2>
              {delivery ? (
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{delivery.customer_name}</p>
                  <p>{delivery.phone_number}</p>
                  <p>{delivery.address}</p>
                  <p>{delivery.city}, {delivery.state} {delivery.zip_code}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No delivery address provided</p>
              )}
            </div>

            {/* Confirm Payment Button */}
            <div className="bg-white shadow-lg rounded-2xl p-6">
              <Button
                onClick={handleConfirm}
                disabled={processing || !method}
                className="w-full py-4 text-lg font-semibold bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl transition-all duration-200 shadow-sm"
              >
                {processing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Confirm Payment • Rs. ${cartTotal.toLocaleString()}`
                )}
              </Button>
              {!method && (
                <p className="text-red-500 text-sm mt-2 text-center">Please select a payment method</p>
              )}
            </div>
          </div>

        </div>
      </div>

      <Modal
        isOpen={cardModalOpen}
        onRequestClose={() => {setCardModalOpen(false); setProcessing(false);}}
        className="max-w-sm mx-auto mt-20 bg-white rounded-2xl shadow-2xl"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Card Details</h2>
            <button
              onClick={() => {setCardModalOpen(false); setProcessing(false);}}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={e => { e.preventDefault(); onSuccess('Card'); setCardModalOpen(false); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input 
                type="text" 
                placeholder="1234 5678 9012 3456" 
                maxLength={19}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                onChange={e => setCardInfo({...cardInfo, number: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input 
                  type="text" 
                  placeholder="MM/YY" 
                  maxLength={5}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  onChange={e => setCardInfo({...cardInfo, expiry: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input 
                  type="password" 
                  placeholder="123" 
                  maxLength={3}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  onChange={e => setCardInfo({...cardInfo, cvv: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {setCardModalOpen(false); setProcessing(false);}}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Pay Rs. {cartTotal.toLocaleString()}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={bankModalOpen}
        onRequestClose={() => {setBankModalOpen(false); setProcessing(false);}}
        className="max-w-md mx-auto mt-20 bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        ariaHideApp={false}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Select Bank</h2>
            <button
              onClick={() => {setBankModalOpen(false); setProcessing(false);}}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Choose your preferred bank for {paymentGateways.find(g => g.slug === method)?.name}
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {paymentGateways
              .find(gateway => gateway.slug === method)
              ?.items.map((bank) => (
                <button
                  key={bank.idx}
                  onClick={() => handleBankSelection(bank)}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 text-left"
                >
                  <div className="flex items-center space-x-3">
                    {bank.logo ? (
                      <img 
                        src={bank.logo} 
                        alt={bank.name}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {bank.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{bank.name}</div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </Modal>
    </div>
    <Footer/>
    </>
  );
};

export default Payment;
