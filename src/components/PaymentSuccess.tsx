import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaShoppingBag, FaMapMarkerAlt, FaCreditCard, FaCalendar } from 'react-icons/fa';
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
  const [status, setStatus] = useState<'success'|'error'|'pending'>('pending');
  const [message, setMessage] = useState('');

  const order = locState?.order;
  const paymentMethod = locState?.paymentMethod;

  useEffect(() => {
    setLoading(false);
    
    if (order) {
      // New order-based success flow
      setStatus('success');
      setMessage('Your order has been placed successfully!');
      toast.success('Order placed successfully!');
    } else {
      // Legacy payment verification flow (fallback)
      setStatus('success');
      let msg = 'Payment completed successfully!';
      msg += `\nTransaction ID: ${query.get('transaction_id') || query.get('pidx') || '-'}`;
      msg += `\nOrder ID: ${query.get('purchase_order_id') || '-'}`;
      
      // Divide amount by 100
      const amount = query.get('amount') || query.get('total_amount');
      const formattedAmount = amount ? `Rs. ${(parseFloat(amount) / 100).toFixed(2)}` : '-';
      msg += `\nAmount: ${formattedAmount}`;
      
      msg += `\nMobile: ${query.get('mobile') || '-'}`;
      msg += `\n\nDetails have been sent to your email as well.`;
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
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-700">Processing your order...</p>
              </div>
            ) : status === 'success' ? (
              <>
                {/* Success Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 text-center">
                  <FaCheckCircle className="mx-auto text-5xl mb-4" />
                  <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
                  <p className="text-green-100">Thank you for your purchase</p>
                </div>

                <div className="p-6">
                  {order ? (
                    <>
                      {/* Order Details */}
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <FaShoppingBag className="mr-2 text-orange-500" />
                            Order Information
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Order Number:</span>
                              <span className="font-medium">{order.order_number}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Amount:</span>
                              <span className="font-medium text-green-600">Rs. {order.total_amount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className="font-medium text-blue-600 capitalize">{order.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Order Date:</span>
                              <span className="font-medium">{formatDate(order.created_at)}</span>
                            </div>
                            {paymentMethod && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Payment Method:</span>
                                <span className="font-medium">{paymentMethod}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-orange-500" />
                            Delivery Information
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium ml-2">{order.delivery_info.customer_name}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Phone:</span>
                              <span className="font-medium ml-2">{order.delivery_info.phone_number}</span>
                            </div>
                            {order.delivery_info.customer_email && (
                              <div>
                                <span className="text-gray-600">Email:</span>
                                <span className="font-medium ml-2">{order.delivery_info.customer_email}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Address:</span>
                              <div className="mt-1">
                                <p className="font-medium">{order.delivery_info.address}</p>
                                <p className="text-gray-600">
                                  {order.delivery_info.city}, {order.delivery_info.state} {order.delivery_info.zip_code}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      {order.items && order.items.length > 0 && (
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                          <div className="bg-gray-50 rounded-lg overflow-hidden">
                            <div className="divide-y divide-gray-200">
                              {order.items.map((item, index) => (
                                <div key={index} className="p-4 flex justify-between items-center">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">Rs. {item.total}</p>
                                    <p className="text-sm text-gray-600">Rs. {item.price} each</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Next Steps */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• We'll send you order updates via email and SMS</li>
                          <li>• Your order will be processed within 24 hours</li>
                          <li>• You can track your order status in "My Orders"</li>
                          <li>• Our delivery team will contact you before delivery</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    /* Legacy fallback display */
                    <div className="text-center py-6">
                      <pre className="text-gray-700 mb-4 whitespace-pre-wrap text-left bg-gray-50 p-4 rounded-lg">
                        {message}
                      </pre>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                      onClick={() => navigate('/my-orders')}
                    >
                      <FaShoppingBag className="mr-2" />
                      View My Orders
                    </button>
                    <button
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      onClick={() => navigate('/marketplace')}
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Error State */
              <div className="text-center py-12">
                <div className="text-red-600 text-5xl mb-4">✗</div>
                <h2 className="text-xl font-semibold mb-2">Order Failed</h2>
                <p className="text-gray-700 mb-6">{message}</p>
                <button
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg"
                  onClick={() => navigate('/cart')}
                >
                  Return to Cart
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentSuccess;
