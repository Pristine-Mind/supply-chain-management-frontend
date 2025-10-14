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
    setLoading(false);
    setStatus('success');
    let msg = 'Payment completed successfully!';
    msg += `\nTransaction ID: ${query.get('transaction_id') || query.get('pidx') || '-'}`;
    msg += `\nOrder ID: ${query.get('purchase_order_id') || '-'}`;
    msg += `\nAmount: Rs. ${query.get('amount') || query.get('total_amount') || '-'}`;
    msg += `\nMobile: ${query.get('mobile') || '-'}`;
    msg += `\n\nDetails have been sent to your email as well.`;
    setMessage(msg);
    toast.success('Payment completed successfully!');
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
              <pre className="text-gray-700 mb-4 whitespace-pre-wrap text-left">{message}</pre>
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
