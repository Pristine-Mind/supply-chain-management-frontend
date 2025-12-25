import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listB2BUserProducts, getB2BUser, B2BUser, MiniProduct } from '../../api/b2bApi';
import { ArrowLeft, Search, Building2, Mail, User, Package, ShoppingBag, Send } from 'lucide-react';
import { sendProductChat } from '../../api/chatApi';
import axios from 'axios';
import { useRef } from 'react';

const B2BUserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<B2BUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [products, setProducts] = useState<MiniProduct[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState('');
  const [modalProduct, setModalProduct] = useState<MiniProduct | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatSentSuccess, setChatSentSuccess] = useState<string | null>(null);
  const [productMessages, setProductMessages] = useState<any[]>([]);
  const [prodMsgsLoading, setProdMsgsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetchUser(Number(userId));
    fetchProducts(Number(userId), undefined, 1);
  }, [userId]);

  const fetchUser = async (id: number) => {
    setLoadingUser(true);
    try {
      const data = await getB2BUser(id);
      const userObj = data?.data ?? data;
      setUser(userObj as B2BUser);
    } catch (e) {
      console.error('fetchUser', e);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchProducts = async (id: number, qParam?: string, pageParam = 1) => {
    setProdLoading(true);
    try {
      const data = await listB2BUserProducts(id, qParam, pageParam, pageSize);
      const payload = data?.data ?? data;
      const results = Array.isArray(payload.results) ? payload.results : Array.isArray(payload) ? payload : [];
      const total = payload.count ?? (Array.isArray(payload) ? payload.length : 0);
      setProducts(results);
      setCount(total);
      setPage(pageParam);
    } catch (e) {
      console.error('fetchProducts', e);
    } finally {
      setProdLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProducts(Number(userId), q || undefined, 1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSendMessage = async () => {
    if (!modalProduct || !chatMessage.trim()) return;
    try {
      setSendingChat(true);
      setChatSentSuccess(null);
      // send and append the new message to the UI immediately
      const res = await sendProductChat(Number(userId), modalProduct.id, chatMessage.trim());
      const newMsg = res?.data || res || { message: chatMessage.trim(), id: Date.now(), timestamp: new Date().toISOString() };
      setProductMessages(prev => [...prev, newMsg]);
      setChatSentSuccess('Message sent to the seller successfully!');
      setChatMessage('');
    } catch (e) {
      console.error('sendProductChat', e);
      setChatSentSuccess('Failed to send message. Please try again.');
    } finally {
      setSendingChat(false);
    }
  };

  const fetchProductMessages = async (productId: number) => {
    setProdMsgsLoading(true);
    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Token ${token}`;

      const resp = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/b2b-verified-users-products/${userId}/products/${productId}/chat/`,
        { headers }
      );
      const msgs = resp.data.results || [];
      setProductMessages(msgs);
    } catch (err) {
      console.error('fetchProductMessages', err);
      setProductMessages([]);
    } finally {
      setProdMsgsLoading(false);
    }
  };

  // when modal opens, load messages for that product
  useEffect(() => {
    if (modalProduct) {
      fetchProductMessages(modalProduct.id);
    } else {
      setProductMessages([]);
      setProdMsgsLoading(false);
    }
  }, [modalProduct]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [productMessages]);

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Back Button */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-orange-600 transition-colors group"
          >
            <div className="p-1.5 rounded-lg group-hover:bg-orange-50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="font-medium">Back to Businesses</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Profile Card */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              {loadingUser ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-white/20 rounded w-64 mb-3"></div>
                  <div className="h-5 bg-white/20 rounded w-48"></div>
                </div>
              ) : user ? (
                <>
                  <h2 className="text-3xl font-bold mb-3">
                    {user.registered_business_name || `${user.first_name} ${user.last_name}`}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                      <User className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-white/70">Username</p>
                        <p className="font-medium">@{user.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                      <Mail className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-white/70">Email</p>
                        <p className="font-medium text-sm">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                      <Building2 className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-white/70">Business Type</p>
                        <p className="font-medium">{user.business_type || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {user.description && (
                    <div className="mt-6 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-white/90 mb-2">About this business</h4>
                      <div 
                        className="text-sm text-white/90 prose prose-sm prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: showFullDescription || user.description.length <= 350
                            ? user.description
                            : `${user.description.slice(0, 350)}…`
                        }}
                      />
                      {user.description.length > 350 && (
                        <button
                          onClick={() => setShowFullDescription(s => !s)}
                          className="mt-3 text-sm font-medium text-white underline"
                        >
                          {showFullDescription ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <h2 className="text-3xl font-bold">Business Profile</h2>
              )}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Products</h3>
            <div className="ml-auto px-4 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-semibold">
              {count} Total
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search products by name, brand, or SKU..."
                className="w-full pl-12 pr-32 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all text-lg shadow-sm"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                Search
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {prodLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading products...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="p-6 bg-gray-100 rounded-full mb-4">
                <ShoppingBag className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-700">No products found</p>
              <p className="text-sm mt-2">Try adjusting your search or check back later</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setModalProduct(p)}
                    className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-orange-500 hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  >
                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      {p.category_info && (
                        <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-md">
                          {p.category_info.name}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 mb-1 line-clamp-2 min-h-[3rem] group-hover:text-orange-600 transition-colors">
                        {p.name}
                      </h4>
                      {p.brand_name && (
                        <p className="text-sm text-gray-500 mb-2">{p.brand_name}</p>
                      )}
                      {p.description && (
                        <div className="text-sm text-gray-700 mb-3">
                          <div 
                            className="line-clamp-3 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: p.description }}
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                          {p.price ? `NPR ${p.price.toLocaleString()}` : 'Price N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-gray-200 gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-bold text-orange-600">{products.length}</span> of <span className="font-bold text-orange-600">{count}</span> products
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchProducts(Number(userId), q || undefined, Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-5 py-2.5 border-2 border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:border-orange-500 hover:bg-orange-50 transition-colors font-medium text-gray-700"
                  >
                    Previous
                  </button>
                  <div className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-bold shadow-md">
                    {page}
                  </div>
                  <button
                    onClick={() => fetchProducts(Number(userId), q || undefined, page + 1)}
                    disabled={page * pageSize >= count}
                    className="px-5 py-2.5 border-2 border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:border-orange-500 hover:bg-orange-50 transition-colors font-medium text-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Product Description Modal */}
      {modalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => {
            setModalProduct(null);
            setChatMessage('');
            setChatSentSuccess(null);
          }}></div>
          <div className="relative max-w-3xl w-full bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-start justify-between bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800">{modalProduct.name}</h3>
                {modalProduct.brand_name && <p className="text-sm text-gray-600 mt-1">{modalProduct.brand_name}</p>}
              </div>
              <button 
                onClick={() => {
                  setModalProduct(null);
                  setChatMessage('');
                  setChatSentSuccess(null);
                }} 
                className="px-4 py-2 rounded-lg hover:bg-white transition-colors font-medium text-gray-700"
              >
                Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {modalProduct.thumbnail && (
                <img 
                  src={modalProduct.thumbnail} 
                  alt={modalProduct.name} 
                  className="w-full h-80 object-cover rounded-xl mb-6 shadow-md" 
                />
              )}
              
              <div 
                className="text-base text-gray-800 prose prose-base max-w-none leading-relaxed mb-6"
                dangerouslySetInnerHTML={{ __html: modalProduct.description || '' }}
              />
              
              <div className="flex items-center justify-between pt-4 border-t mb-6">
                {modalProduct.category_info && (
                  <span className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-semibold">
                    {modalProduct.category_info.name}
                  </span>
                )}
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                  {modalProduct.price ? `NPR ${modalProduct.price.toLocaleString()}` : 'Price N/A'}
                </span>
              </div>

              {/* Message Seller Section */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Send className="w-5 h-5 text-orange-600" />
                  Message the Seller
                </h4>
                
                {productMessages.length > 0 || prodMsgsLoading ? (
                  <div className="mb-4 max-h-64 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    {prodMsgsLoading ? (
                      <div className="text-center py-6 text-gray-500">Loading messages...</div>
                    ) : (
                      productMessages.map((m: any) => (
                        <div key={m.id || `${m.timestamp}-${Math.random()}`} className="">
                          <div className="text-xs text-gray-500 mb-1">{m.sender_details?.username || 'You'} • {new Date(m.timestamp).toLocaleString()}</div>
                          <div className="p-3 bg-white rounded-lg border text-sm text-gray-800">{m.message}</div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                ) : null}

                {chatSentSuccess && (
                  <div className={`p-4 rounded-lg mb-4 ${
                    chatSentSuccess.includes('successfully') 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {chatSentSuccess}
                  </div>
                )}

                <textarea
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  placeholder="Write your message to the seller about this product..."
                  className="w-full border-2 border-gray-200 rounded-lg p-4 text-sm min-h-[120px] focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all resize-none"
                  disabled={sendingChat}
                />

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingChat || !chatMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sendingChat ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setModalProduct(null);
                      setChatMessage('');
                      setChatSentSuccess(null);
                      setProductMessages([]);
                    }}
                    className="px-6 py-3 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors font-medium text-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default B2BUserProfile;
