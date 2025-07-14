import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import Modal from 'react-modal';
import KhaltiService from '../core/services/khaltiService';
import { toast } from 'react-toastify';

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

  return (
    <div className="bg-white min-h-screen">
      <header className="flex items-center p-4 shadow-md bg-white justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <Card className="shadow-lg rounded-2xl mb-6 border-gray-500">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>Rs.{subTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span>Rs.{shipping}</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>Rs.{cartTotal}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">Payment Method</h2>
          {(['cod','card','khalti'] as const).map(key => {
            const opts = {
              cod: { title:'Cash on Delivery', desc:'Pay on delivery' },
              card: { title:'Credit/Debit Card', desc:'Secure card payment' },
              khalti: { title:'Khalti Wallet', desc:'Scan & pay via Khalti' }
            };
            const sel = method===key;
            return (
              <motion.div
                key={key}
                onClick={()=>setMethod(key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 mb-3 border rounded-xl cursor-pointer transition
                  ${sel ? 'border-orange-500 bg-orange-50 shadow' : 'border-gray-500'}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-800">{opts[key].title}</div>
                    <div className="text-sm text-gray-600">{opts[key].desc}</div>
                  </div>
                  {sel && <FaCheckCircle className="text-orange-500 text-xl" />}
                </div>
              </motion.div>
            );
          })}
        </div>

        {delivery && (
          <Card className="shadow-lg rounded-2xl border-gray-500">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
              <p className="font-medium">{delivery.customerName}</p>
              <p className="text-sm mb-1">{delivery.phoneNumber}</p>
              <p className="text-sm">{delivery.address}, {delivery.city}</p>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleConfirm}
          disabled={processing}
          className="w-full py-4 text-lg bg-orange-500 hover:bg-orange-600"
        >
          {processing ? 'Processing...' : `Confirm & Pay Rs.${cartTotal}`}
        </Button>
      </main>

      <Modal
        isOpen={cardModalOpen}
        onRequestClose={()=>{setCardModalOpen(false); setProcessing(false);}}
        className="max-w-md mx-auto mt-32 bg-white p-6 rounded-2xl shadow-xl"
      >
        <h2 className="text-2xl font-semibold mb-4">Enter Card Details</h2>
        <form onSubmit={e=>{ e.preventDefault(); onSuccess('Card'); setCardModalOpen(false); }}>
          <input type="text" placeholder="Card Number" maxLength={16} required
            className="w-full mb-3 p-3 border rounded-xl" onChange={e=>setCardInfo({...cardInfo, number:e.target.value})} />
          <div className="flex space-x-3 mb-3">
            <input type="text" placeholder="MM/YY" maxLength={5} required
              className="flex-1 p-3 border rounded-xl" onChange={e=>setCardInfo({...cardInfo, expiry:e.target.value})} />
            <input type="password" placeholder="CVV" maxLength={3} required
              className="w-24 p-3 border rounded-xl" onChange={e=>setCardInfo({...cardInfo, cvv:e.target.value})} />
          </div>
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={()=>{setCardModalOpen(false); setProcessing(false);}}>Cancel</Button>
            <Button type="submit">Pay Rs.{cartTotal}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payment;
