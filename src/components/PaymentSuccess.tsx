import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from './Navbar';
import Footer from './Footer';

function useQuery() {
  return new URLSearchParams(window.location.search);
}

const PaymentSuccess: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success'|'error'|'pending'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const callback = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        for (const [key, value] of query.entries()) {
          params[key] = value;
        }
        const response = await fetch('https://appmulyabazzar.com/api/v1/payments/callback/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        const result = await response.json();
        if (response.ok && result.status === 'success') {
          setStatus('success');
          let msg = result.message || 'Payment completed successfully!';
          if (result.data) {
            msg += `\nOrder Number: ${result.data.order_number}`;
            msg += `\nAmount: Rs. ${result.data.amount}`;
            if (result.data.marketplace_sales && result.data.marketplace_sales.length > 0) {
              msg += `\nItems:`;
              result.data.marketplace_sales.forEach((item: any) => {
                msg += `\n- ${item.product_name} x${item.quantity} (Seller: ${item.seller})`;
              });
            }
          }
          setMessage(msg);
          toast.success(result.message || 'Payment completed successfully!');
        } else {
          setStatus('error');
          setMessage(result.message || 'Payment verification failed.');
          toast.error(result.message || 'Payment verification failed.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage('Payment verification failed.');
        toast.error('Payment verification failed.');
      } finally {
        setLoading(false);
      }
    };
    callback();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700">Verifying payment...</p>
            </div>
          ) : status === 'success' ? (
            <>
              <div className="text-green-600 text-4xl mb-2">✓</div>
              <h2 className="text-xl font-semibold mb-2">Payment Successful</h2>
              <p className="text-gray-700 mb-4">{message}</p>
              <button
                className="bg-orange-500 text-white px-4 py-2 rounded-lg mt-2"
                onClick={() => navigate('/marketplace')}
              >
                Go to Marketplace
              </button>
            </>
          ) : (
            <>
              <div className="text-red-600 text-4xl mb-2">✗</div>
              <h2 className="text-xl font-semibold mb-2">Payment Failed</h2>
              <p className="text-gray-700 mb-4">{message}</p>
              <button
                className="bg-orange-500 text-white px-4 py-2 rounded-lg mt-2"
                onClick={() => navigate('/')}
              >
                Go Home
              </button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentSuccess;
