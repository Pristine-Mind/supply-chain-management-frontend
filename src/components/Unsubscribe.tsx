import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';

const Unsubscribe: React.FC = () => {
  const [searchParams] = useSearchParams();
  const emailFromParam = searchParams.get('email') || '';
  const tokenFromParam = searchParams.get('token') || '';

  const [email, setEmail] = useState(emailFromParam);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // If a token is present in the URL, auto-submit on mount
  useEffect(() => {
    if (tokenFromParam) {
      handleUnsubscribeWithToken(tokenFromParam);
    }
  }, [tokenFromParam]);

  const handleUnsubscribeWithToken = async (token: string) => {
    setStatus('loading');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/unsubscribe/?token=${encodeURIComponent(token)}`,
        { method: 'POST' }
      );
      if (res.ok) {
        setStatus('success');
        setMessage('You have been successfully unsubscribed from all marketing emails.');
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setMessage(data.detail || data.message || 'This unsubscribe link is invalid or has already been used.');
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred. Please try again or contact support.');
    }
  };

  const handleUnsubscribeWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/unsubscribe/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        }
      );
      if (res.ok) {
        setStatus('success');
        setMessage('You have been successfully unsubscribed from all marketing emails.');
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setMessage(data.detail || data.message || 'We could not find an account with that email address.');
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred. Please try again or contact support.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
              <Mail className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Unsubscribe</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Unsubscribe from Mulya Bazzar marketing and promotional emails.
            </p>
          </div>

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium">Unsubscribed successfully</p>
                <p className="text-green-700 text-sm mt-1">{message}</p>
                <p className="text-green-600 text-sm mt-2">
                  You may still receive transactional emails (order confirmations, receipts) as required by law.
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{message}</p>
            </div>
          )}

          {status !== 'success' && !tokenFromParam && (
            <form onSubmit={handleUnsubscribeWithEmail} className="space-y-4">
              <div>
                <label htmlFor="unsubscribe-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Your email address
                </label>
                <input
                  id="unsubscribe-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="w-full py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? 'Processing...' : 'Unsubscribe'}
              </button>
            </form>
          )}

          {status === 'loading' && tokenFromParam && (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Processing your request...</p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-6">
            Need help?{' '}
            <Link to="/contact" className="text-orange-600 hover:underline">
              Contact support
            </Link>
            {' '}or review our{' '}
            <Link to="/privacy" className="text-orange-600 hover:underline">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Unsubscribe;
