import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listB2BUserProducts, getB2BUser, B2BUser, MiniProduct, Negotiation, createNegotiation, getActiveNegotiation, updateNegotiation } from '../../api/b2bApi';
import { ArrowLeft, Search, Building2, Mail, User, Package, ShoppingBag, Send, MessageCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../auth/LoginModal';
import { sendProductChat } from '../../api/chatApi';
import axios from 'axios';

interface ProductMessage {
  id: number;
  message: string;
  timestamp: string;
  sender_details?: {
    username: string;
  };
}

interface PendingProductAuth {
  product: MiniProduct;
  quantity: number;
  action: 'buy';
}

const B2BUserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [user, setUser] = useState<B2BUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [products, setProducts] = useState<MiniProduct[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const [modalProduct, setModalProduct] = useState<MiniProduct | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [chatSentSuccess, setChatSentSuccess] = useState<string | null>(null);
  const [productMessages, setProductMessages] = useState<ProductMessage[]>([]);
  const [prodMsgsLoading, setProdMsgsLoading] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProductForAuth, setPendingProductForAuth] = useState<PendingProductAuth | null>(null);

  const [activeNegotiation, setActiveNegotiation] = useState<Negotiation | null>(null);
  const [negotiationLoading, setNegotiationLoading] = useState(false);
  const [negotiationPrice, setNegotiationPrice] = useState<string>('');
  const [negotiationQty, setNegotiationQty] = useState<string>('');
  const [negotiationMsg, setNegotiationMsg] = useState('');
  const [isNegotiating, setIsNegotiating] = useState(false);

  const pageSize = 24;

  const transformMiniToMarketplace = useCallback((p: MiniProduct) => {
    const listingId = (p as any).marketplace_id ?? p.id;
    return {
      id: listingId,
      product: listingId,
      product_details: {
        id: p.id,
        name: p.name,
        images: [{ 
          id: p.id, 
          image: p.thumbnail || '', 
          alt_text: null, 
          created_at: new Date().toISOString() 
        }],
        price: p.price || 0,
      },
      listed_price: p.price || 0,
      discounted_price: null,
      percent_off: 0,
      savings_amount: 0,
      offer_start: null,
      offer_end: null,
      is_offer_active: false,
      offer_countdown: null,
      estimated_delivery_days: null,
      shipping_cost: '0',
      is_free_shipping: true,
      recent_purchases_count: 0,
      listed_date: new Date().toISOString(),
      is_available: true,
      min_order: 1,
      latitude: 0,
      longitude: 0,
      bulk_price_tiers: [],
      variants: [],
      reviews: [],
      average_rating: 0,
      ratings_breakdown: {},
      total_reviews: 0,
      view_count: 0,
      rank_score: 0,
    };
  }, []);

  // Fetch user data
  const fetchUser = useCallback(async (id: number) => {
    setLoadingUser(true);
    try {
      const data = await getB2BUser(id);
      const userObj = data?.data ?? data;
      setUser(userObj as B2BUser);
    } catch (e) {
      console.error('fetchUser error:', e);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (id: number, qParam?: string, pageParam = 1) => {
    setProdLoading(true);
    try {
      const data = await listB2BUserProducts(id, qParam, pageParam, pageSize);
      const payload = data?.data ?? data;
      const results = Array.isArray(payload.results) 
        ? payload.results 
        : Array.isArray(payload) 
        ? payload 
        : [];
      const total = payload.count ?? (Array.isArray(payload) ? payload.length : 0);
      
      setProducts(results);
      setCount(total);
      setPage(pageParam);
    } catch (e) {
      console.error('fetchProducts error:', e);
      setProducts([]);
      setCount(0);
    } finally {
      setProdLoading(false);
    }
  }, []);

  // Fetch product messages
  const fetchProductMessages = useCallback(async (productId: number, marketplaceId: number) => {
    if (!userId) return;
    
    setProdMsgsLoading(true);
    setNegotiationLoading(true);
    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Token ${token}`;

      const [msgResp, negResp] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/b2b-verified-users-products/${userId}/products/${productId}/chat/`,
          { headers }
        ),
        getActiveNegotiation(marketplaceId).catch(() => null)
      ]);

      const msgs: ProductMessage[] = msgResp.data.results || [];
      setProductMessages(msgs);
      setActiveNegotiation(negResp);
    } catch (err) {
      console.error('fetchProductMessages or negotiation error:', err);
      setProductMessages([]);
    } finally {
      setProdMsgsLoading(false);
      setNegotiationLoading(false);
    }
  }, [userId]);

  // Handlers
  const handleSearch = useCallback(() => {
    if (userId) {
      fetchProducts(Number(userId), q || undefined, 1);
    }
  }, [userId, q, fetchProducts]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const incQty = useCallback((id: number) => {
    setQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }, []);

  const decQty = useCallback((id: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
  }, []);

  const handleBuyNow = useCallback(async (e: React.MouseEvent, p: MiniProduct) => {
    e.stopPropagation();
    
    // Check for active accepted negotiation for this product
    let finalPrice = p.price || 0;
    let finalQty = quantities[p.id] || 0;
    
    // If we're clicking from the modal and there's an accepted negotiation
    if (activeNegotiation && activeNegotiation.product === p.id && activeNegotiation.status === 'ACCEPTED') {
      finalPrice = activeNegotiation.proposed_price;
      finalQty = activeNegotiation.proposed_quantity;
    }

    if (finalQty === 0) {
      return; 
    }
    
    if (!isAuthenticated) {
      setPendingProductForAuth({ product: p, quantity: finalQty, action: 'buy' });
      setShowLoginModal(true);
      return;
    }

    try {
      const mp = transformMiniToMarketplace(p);
      // Override price if negotiated
      const marketplaceProduct = {
        ...mp,
        listed_price: finalPrice,
        product_details: {
          ...mp.product_details,
          price: finalPrice
        }
      };
      await addToCart(marketplaceProduct as any, finalQty);
      navigate('/delivery-details');
    } catch (err) {
      console.error('handleBuyNow error:', err);
    }
  }, [quantities, isAuthenticated, transformMiniToMarketplace, addToCart, navigate, activeNegotiation]);

  const handleSendMessage = useCallback(async () => {
    if (!modalProduct || !chatMessage.trim() || !userId) return;
    
    setSendingChat(true);
    setChatSentSuccess(null);
    
    try {
      const res = await sendProductChat(Number(userId), modalProduct.id, chatMessage.trim());
      const newMsg: ProductMessage = res?.data || res || { 
        id: Date.now(), 
        message: chatMessage.trim(), 
        timestamp: new Date().toISOString() 
      };
      
      setProductMessages(prev => [...prev, newMsg]);
      setChatSentSuccess('Message sent to the seller successfully!');
      setChatMessage('');
    } catch (e) {
      console.error('sendProductChat error:', e);
      setChatSentSuccess('Failed to send message. Please try again.');
    } finally {
      setSendingChat(false);
    }
  }, [modalProduct, chatMessage, userId]);

  const handleNegotiate = useCallback(async () => {
    if (!modalProduct || !negotiationPrice || !negotiationQty) return;
    
    setNegotiationLoading(true);
    const mid = modalProduct.marketplace_id || modalProduct.id;
    try {
      if (activeNegotiation) {
        // Counter offer
        const updated = await updateNegotiation(activeNegotiation.id, {
          price: Number(negotiationPrice),
          quantity: Number(negotiationQty),
          message: negotiationMsg,
          status: 'COUNTER_OFFER'
        });
        setActiveNegotiation(updated);
      } else {
        // New negotiation
        const created = await createNegotiation(
          mid,
          Number(negotiationPrice),
          Number(negotiationQty),
          negotiationMsg
        );
        setActiveNegotiation(created);
      }
      setIsNegotiating(false);
      setNegotiationMsg('');
      setChatSentSuccess('Negotiation offer sent successfully!');
      fetchProductMessages(modalProduct.id, mid);
    } catch (err) {
      console.error('handleNegotiate error:', err);
      setChatSentSuccess('Failed to send negotiation offer.');
    } finally {
      setNegotiationLoading(false);
    }
  }, [modalProduct, negotiationPrice, negotiationQty, negotiationMsg, activeNegotiation, fetchProductMessages]);

  const handleUpdateNegotiationStatus = useCallback(async (status: 'ACCEPTED' | 'REJECTED') => {
    if (!activeNegotiation || !modalProduct) return;
    
    setNegotiationLoading(true);
    const mid = modalProduct.marketplace_id || modalProduct.id;
    try {
      const updated = await updateNegotiation(activeNegotiation.id, { status });
      setActiveNegotiation(updated);
      setChatSentSuccess(`Negotiation ${status.toLowerCase()} successfully!`);
      fetchProductMessages(modalProduct.id, mid);
    } catch (err) {
      console.error('handleUpdateNegotiationStatus error:', err);
      setChatSentSuccess(`Failed to ${status.toLowerCase()} negotiation.`);
    } finally {
      setNegotiationLoading(false);
    }
  }, [activeNegotiation, modalProduct, fetchProductMessages]);

  const closeModal = useCallback(() => {
    setModalProduct(null);
    setChatMessage('');
    setChatSentSuccess(null);
    setProductMessages([]);
    setActiveNegotiation(null);
    setIsNegotiating(false);
    setNegotiationPrice('');
    setNegotiationQty('');
    setNegotiationMsg('');
  }, []);

  const handleLoginSuccess = useCallback(async () => {
    setShowLoginModal(false);
    
    if (!pendingProductForAuth) return;
    
    try {
      const { product, quantity, action } = pendingProductForAuth;
      
      if (quantity === 0) {
        setPendingProductForAuth(null);
        return;
      }
      
      const mp = transformMiniToMarketplace(product);
      await addToCart(mp as any, quantity);
      setPendingProductForAuth(null);
      
      if (action === 'buy') {
        navigate('/delivery-details');
      }
    } catch (err) {
      console.error('post-login action failed:', err);
    }
  }, [pendingProductForAuth, transformMiniToMarketplace, addToCart, navigate]);

  // Effects
  useEffect(() => {
    if (!userId) return;
    fetchUser(Number(userId));
    fetchProducts(Number(userId), undefined, 1);
  }, [userId, fetchUser, fetchProducts]);

  useEffect(() => {
    if (modalProduct) {
      fetchProductMessages(modalProduct.id, modalProduct.marketplace_id || modalProduct.id);
    } else {
      setProductMessages([]);
      setProdMsgsLoading(false);
    }
  }, [modalProduct, fetchProductMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [productMessages]);

  // Computed values
  const totalPages = useMemo(() => Math.ceil(count / pageSize), [count]);
  const isLastPage = useMemo(() => page >= totalPages, [page, totalPages]);

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Back Button */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-orange-600 transition-colors group"
            aria-label="Go back to businesses"
          >
            <div className="p-1.5 rounded-lg group-hover:bg-orange-50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="font-medium">Back to Businesses</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Profile Card */}
        <section className="bg-gradient-to-r from-orange-400 to-orange-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
          {loadingUser ? (
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded w-64 mb-3"></div>
              <div className="h-5 bg-white/20 rounded w-48"></div>
            </div>
          ) : user ? (
            <>
              <h1 className="text-3xl font-bold mb-3">
                {user.registered_business_name || `${user.first_name} ${user.last_name}`}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <User className="w-5 h-5" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-white/70">Username</p>
                    <p className="font-medium">@{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <Mail className="w-5 h-5" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-white/70">Email</p>
                    <p className="font-medium text-sm break-all">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
                  <Building2 className="w-5 h-5" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-white/70">Business Type</p>
                    <p className="font-medium">{user.business_type || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {user.description && (
                <div className="mt-6 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                  <h2 className="text-sm font-semibold text-white/90 mb-2">About this business</h2>
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
                      onClick={() => setShowFullDescription(prev => !prev)}
                      className="mt-3 text-sm font-medium text-white underline hover:no-underline"
                      aria-expanded={showFullDescription}
                    >
                      {showFullDescription ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <h1 className="text-3xl font-bold">Business Profile</h1>
          )}
        </section>

        {/* Products Section */}
        <section className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Products</h2>
            <div className="ml-auto px-4 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-semibold">
              {count} Total
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search products by name, brand, or SKU..."
                className="w-full pl-12 pr-32 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all text-lg shadow-sm"
                aria-label="Search products"
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
                <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" role="status" aria-label="Loading products"></div>
                <p className="text-gray-600 font-medium">Loading products...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="p-6 bg-gray-100 rounded-full mb-4">
                <ShoppingBag className="w-16 h-16 text-gray-400" aria-hidden="true" />
              </div>
              <p className="text-xl font-semibold text-gray-700">No products found</p>
              <p className="text-sm mt-2">Try adjusting your search or check back later</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(p => (
                  <article
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
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-16 h-16 text-gray-300" aria-hidden="true" />
                        </div>
                      )}
                      {p.category_info && (
                        <span className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-md">
                          {p.category_info.name}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 min-h-[3rem] group-hover:text-orange-600 transition-colors">
                        {p.name}
                      </h3>
                      {p.brand_name && (
                        <p className="text-sm text-gray-500 mb-2">{p.brand_name}</p>
                      )}
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                            {p.price ? `NPR ${p.price.toLocaleString()}` : 'Price N/A'}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border rounded-lg overflow-hidden" role="group" aria-label="Quantity selector">
                              <button
                                onClick={(e) => { e.stopPropagation(); decQty(p.id); }}
                                className="px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors"
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>
                              <div className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center" aria-live="polite">
                                {quantities[p.id] || 0}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); incQty(p.id); }}
                                className="px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={(e) => handleBuyNow(e, p)}
                              disabled={!quantities[p.id] || quantities[p.id] === 0}
                              className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Buy Now
                            </button>
                          </div>
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); setModalProduct(p); setIsNegotiating(true); }}
                            className="w-full py-2 px-3 rounded-lg text-sm font-semibold border-2 border-orange-600 text-orange-600 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Negotiate Price
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              <nav className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-gray-200 gap-4" aria-label="Product pagination">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-bold text-orange-600">{products.length}</span> of <span className="font-bold text-orange-600">{count}</span> products
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchProducts(Number(userId), q || undefined, Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-5 py-2.5 border-2 border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:border-orange-500 hover:bg-orange-50 transition-colors font-medium text-gray-700"
                    aria-label="Go to previous page"
                  >
                    Previous
                  </button>
                  <div className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-bold shadow-md" aria-current="page">
                    {page}
                  </div>
                  <button
                    onClick={() => fetchProducts(Number(userId), q || undefined, page + 1)}
                    disabled={isLastPage}
                    className="px-5 py-2.5 border-2 border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:border-orange-500 hover:bg-orange-50 transition-colors font-medium text-gray-700"
                    aria-label="Go to next page"
                  >
                    Next
                  </button>
                </div>
              </nav>
            </>
          )}
        </section>
      </main>

      {/* Product Modal */}
      {modalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} aria-hidden="true"></div>
          <div className="relative max-w-3xl w-full bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <header className="p-6 border-b flex items-start justify-between bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex-1">
                <h3 id="modal-title" className="text-2xl font-bold text-gray-800">{modalProduct.name}</h3>
                {modalProduct.brand_name && <p className="text-sm text-gray-600 mt-1">{modalProduct.brand_name}</p>}
              </div>
              <button 
                onClick={closeModal}
                className="px-4 py-2 rounded-lg hover:bg-white transition-colors font-medium text-gray-700"
                aria-label="Close modal"
              >
                Close
              </button>
            </header>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {modalProduct.thumbnail && (
                <img 
                  src={modalProduct.thumbnail} 
                  alt={modalProduct.name} 
                  className="w-full h-80 object-cover rounded-xl mb-6 shadow-md" 
                />
              )}
              
              {modalProduct.description && (
                <div 
                  className="text-base text-gray-800 prose prose-base max-w-none leading-relaxed mb-6"
                  dangerouslySetInnerHTML={{ __html: modalProduct.description }}
                />
              )}
              
              <div className="flex items-center justify-between pt-4 border-t mb-6 flex-wrap gap-3">
                {modalProduct.category_info && (
                  <span className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-semibold">
                    {modalProduct.category_info.name}
                  </span>
                )}
                <div className="flex flex-col items-end">
                  <span className={`text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent ${activeNegotiation?.status === 'ACCEPTED' ? 'line-through text-sm opacity-50' : ''}`}>
                    {modalProduct.price ? `NPR ${modalProduct.price.toLocaleString()}` : 'Price N/A'}
                  </span>
                  {activeNegotiation?.status === 'ACCEPTED' && (
                    <span className="text-2xl font-bold text-green-600">
                      NPR {activeNegotiation.proposed_price.toLocaleString()} (Negotiated)
                    </span>
                  )}
                </div>
              </div>

              {/* Negotiation Section */}
              <section className="bg-orange-50 p-4 rounded-xl border-2 border-orange-100 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-orange-600" />
                    Price Negotiation
                  </h4>
                  {activeNegotiation && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      activeNegotiation.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                      activeNegotiation.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {activeNegotiation.status}
                    </span>
                  )}
                </div>

                {activeNegotiation ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm border">
                        <p className="text-xs text-gray-500 mb-1">Proposed Price</p>
                        <p className="font-bold text-lg">NPR {activeNegotiation.proposed_price.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm border">
                        <p className="text-xs text-gray-500 mb-1">Proposed Quantity</p>
                        <p className="font-bold text-lg">{activeNegotiation.proposed_quantity} units</p>
                      </div>
                    </div>

                    {activeNegotiation.status === 'COUNTER_OFFER' && activeNegotiation.last_offer_by !== user?.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateNegotiationStatus('ACCEPTED')}
                          className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle2 className="w-5 h-5" /> Accept Offer
                        </button>
                        <button
                          onClick={() => handleUpdateNegotiationStatus('REJECTED')}
                          className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-5 h-5" /> Reject
                        </button>
                        <button
                          onClick={() => {
                            setNegotiationPrice(activeNegotiation.proposed_price.toString());
                            setNegotiationQty(activeNegotiation.proposed_quantity.toString());
                            setIsNegotiating(true);
                          }}
                          className="flex-1 py-3 border-2 border-orange-600 text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition-colors"
                        >
                          Counter
                        </button>
                      </div>
                    )}

                    {activeNegotiation.status === 'ACCEPTED' && (
                      <button
                        onClick={(e) => handleBuyNow(e, modalProduct)}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                      >
                        Buy at Negotiated Price
                      </button>
                    )}
                  </div>
                ) : (
                  !isNegotiating && (
                    <button
                      onClick={() => setIsNegotiating(true)}
                      className="w-full py-3 bg-white border-2 border-dashed border-orange-300 rounded-xl text-orange-700 font-semibold hover:bg-orange-100/50 transition-colors"
                    >
                      Start Negotiation
                    </button>
                  )
                )}

                {isNegotiating && (
                  <div className="mt-4 space-y-4 bg-white p-4 rounded-xl border border-orange-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Proposed Price (per unit)</label>
                        <input
                          type="number"
                          value={negotiationPrice}
                          onChange={e => setNegotiationPrice(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Proposed Quantity</label>
                        <input
                          type="number"
                          value={negotiationQty}
                          onChange={e => setNegotiationQty(e.target.value)}
                          placeholder="e.g. 10"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Note to seller (optional)</label>
                      <textarea
                        value={negotiationMsg}
                        onChange={e => setNegotiationMsg(e.target.value)}
                        placeholder="Explain why you're proposing this price..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none h-20 resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsNegotiating(false)}
                        className="flex-1 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleNegotiate}
                        disabled={!negotiationPrice || !negotiationQty || negotiationLoading}
                        className="flex-[2] py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50"
                      >
                        {negotiationLoading ? 'Sending...' : activeNegotiation ? 'Send Counter Offer' : 'Send Initial Offer'}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Message Seller Section */}
              <section className="border-t pt-6">
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Send className="w-5 h-5 text-orange-600" aria-hidden="true" />
                  Message the Seller
                </h4>
                
                {(productMessages.length > 0 || prodMsgsLoading) && (
                  <div className="mb-4 max-h-64 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    {prodMsgsLoading ? (
                      <p className="text-center py-6 text-gray-500">Loading messages...</p>
                    ) : (
                      productMessages.map((m) => (
                        <div key={m.id} className="">
                          <div className="text-xs text-gray-500 mb-1">
                            {m.sender_details?.username || 'You'} • {new Date(m.timestamp).toLocaleString()}
                          </div>
                          <div className="p-3 bg-white rounded-lg border text-sm text-gray-800">{m.message}</div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {chatSentSuccess && (
                  <div className={`p-4 rounded-lg mb-4 ${
                    chatSentSuccess.includes('successfully') 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`} role="alert">
                    {chatSentSuccess}
                  </div>
                )}

                <label htmlFor="chat-message" className="sr-only">Message to seller</label>
                <textarea
                  id="chat-message"
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  placeholder="Write your message to the seller about this product..."
                  className="w-full border-2 border-gray-200 rounded-lg p-4 text-sm min-h-[120px] focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all resize-none"
                  disabled={sendingChat}
                />

                <div className="mt-4 flex items-center gap-3 flex-wrap">
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
                    onClick={closeModal}
                    className="px-6 py-3 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors font-medium text-gray-700"
                  >
                    Close
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default B2BUserProfile;
