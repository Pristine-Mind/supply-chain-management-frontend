import React, { useState } from 'react';
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
  customerName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
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

  const { subTotal, shipping, total: cartTotal, clear } = useCart();

  const [method, setMethod] = useState<'cod'|'card'|'khalti'>('cod');
  const [processing, setProcessing] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardInfo, setCardInfo] = useState({ number:'', expiry:'', cvv:'' });

  const delay = (ms:number) => new Promise(res=>setTimeout(res,ms));

  const onSuccess = (m: string) => {
    toast.success(`🎉 Payment successful with ${m}!`);
    clear();
    navigate('/marketplace', { replace: true });
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      if (method === 'card') {
        setCardModalOpen(true);
        setProcessing(false);
        return;
      }
      if (method === 'khalti') {
        const res = await KhaltiService.initiatePayment({
          amount: Math.round(cartTotal * 100),
          orderId: `${Date.now()}`,
          orderName: 'Order Payment',
          customer: { name: delivery?.customerName, phone: delivery?.phoneNumber }
        });
        if (res.success) return onSuccess('Khalti');
        throw new Error(res.error || 'Khalti payment failed');
      }
      await delay(1000);
      return onSuccess('Cash on Delivery');
    } catch (err: any) {
      toast.error(err.message);
      setProcessing(false);
    }
  };

  const paymentMethods = [
    {
      key: 'cod' as const,
      title: 'Cash on Delivery',
      desc: 'Pay when your order arrives',
      icon: <FaMoneyBillWave className="text-green-600 text-xl" />,
      color: 'green'
    },
    {
      key: 'card' as const,
      title: 'Credit/Debit Card',
      desc: 'Secure card payment',
      icon: <FaCreditCard className="text-blue-600 text-xl" />,
      color: 'blue'
    },
    {
      key: 'khalti' as const,
      title: 'Khalti Wallet',
      desc: 'Digital wallet payment',
      icon: <FaWallet className="text-purple-600 text-xl" />,
      color: 'purple'
    }
  ];

  return (
    <>  
    <Navbar/>
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-20 md:pt-10">
      <div className="w-full max-w-lg min-h-[80vh] bg-white shadow-lg rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 space-y-6">
          
          <div className="bg-gray-50 rounded-xl p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Rs. {subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>Rs. {shipping.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold text-base text-gray-900">
                  <span>Total Amount</span>
                  <span>Rs. {cartTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Choose Payment Method</h2>
            <div className="space-y-3">
              {paymentMethods.map((option) => {
                const isSelected = method === option.key;
                return (
                  <motion.div
                    key={option.key}
                    onClick={() => setMethod(option.key)}
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
                        {option.icon}
                        <div>
                          <div className="font-medium text-gray-900">{option.title}</div>
                          <div className="text-sm text-gray-500">{option.desc}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
                        >
                          <FaCheckCircle className="text-white text-xs" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          {delivery && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Delivery Address</h2>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">{delivery.customerName}</p>
                <p className="text-gray-600">{delivery.phoneNumber}</p>
                <p className="text-gray-600">
                  {delivery.address}
                </p>
                <p className="text-gray-600">
                  {delivery.city}, {delivery.state} {delivery.zipCode}
                </p>
              </div>
            </div>
          )}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-xs text-green-700">
                Your payment information is secure and encrypted
              </p>
            </div>
          </div>

        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <Button
            onClick={handleConfirm}
            disabled={processing}
            className="w-full py-3 text-base font-semibold bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl transition-all duration-200 shadow-sm"
          >
            {processing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `Confirm Payment • Rs. ${cartTotal.toLocaleString()}`
            )}
          </Button>
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
    </div>
    <Footer/>
    </>
  );
};

export default Payment;
