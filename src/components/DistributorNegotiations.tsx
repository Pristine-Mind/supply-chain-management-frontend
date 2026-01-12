import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listNegotiations, updateNegotiation, Negotiation } from '../api/b2bApi';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  MessageCircle, 
  User, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  ExternalLink,
  History,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useToast } from '../context/ToastContext';

const DistributorNegotiations: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER'>('ALL');
  
  // Counter offer state
  const [counterId, setCounterId] = useState<number | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQty, setCounterQty] = useState('');
  const [counterMsg, setCounterMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History state
  const [viewHistoryId, setViewHistoryId] = useState<number | null>(null);

  const fetchNegotiations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listNegotiations();
      const results = data.results || data || [];
      // Sort by updated_at descending
      const sorted = (Array.isArray(results) ? [...results] : []).sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setNegotiations(sorted);
    } catch (err) {
      console.error('Failed to fetch negotiations:', err);
      addToast('error', 'Failed to load negotiations');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchNegotiations();
  }, [fetchNegotiations]);

  const handleStatusUpdate = async (id: number, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await updateNegotiation(id, { status });
      addToast('success', `Negotiation ${status.toLowerCase()} successfully`);
      fetchNegotiations();
    } catch (err) {
      console.error('Failed to update status:', err);
      addToast('error', 'Failed to update negotiation status');
    }
  };

  const handleSendCounter = async (id: number) => {
    if (!counterPrice || !counterQty) {
      addToast('error', 'Price and Quantity are required');
      return;
    }
    setSubmitting(true);
    try {
      await updateNegotiation(id, {
        price: Number(counterPrice),
        quantity: Number(counterQty),
        message: counterMsg,
        status: 'COUNTER_OFFER'
      });
      addToast('success', 'Counter offer sent to buyer');
      setCounterId(null);
      setCounterPrice('');
      setCounterQty('');
      setCounterMsg('');
      fetchNegotiations();
    } catch (err) {
      console.error('Failed to send counter offer:', err);
      addToast('error', 'Failed to send counter offer');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNegotiations = useMemo(() => 
    negotiations.filter(n => filter === 'ALL' || n.status === filter),
    [negotiations, filter]
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Product Negotiations</h1>
              <p className="text-slate-500 font-medium">Manage price and quantity offers from buyers</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(['ALL', 'PENDING', 'COUNTER_OFFER', 'ACCEPTED', 'REJECTED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filter === f 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredNegotiations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No negotiations found</h3>
            <p className="text-slate-500">Wait for buyers to propose deals on your products.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredNegotiations.map((neg) => {
              const isTurnToAct = neg.last_offer_by !== currentUser?.id;
              const hasHistory = neg.history && neg.history.length > 0;

              return (
              <Card key={neg.id} className="border-none shadow-sm ring-1 ring-slate-200 hover:ring-orange-300 transition-all overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row items-stretch">
                    {/* Status Indicator */}
                    <div className={`w-2 h-auto ${
                      neg.status === 'ACCEPTED' ? 'bg-green-500' :
                      neg.status === 'REJECTED' ? 'bg-red-500' :
                      neg.status === 'COUNTER_OFFER' ? 'bg-blue-500' :
                      'bg-orange-500'
                    }`} />
                    
                    <div className="flex-1 p-6">
                      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4 border-b border-slate-50 pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                            {neg.product_details?.thumbnail ? (
                              <img src={neg.product_details.thumbnail} alt={neg.product_details.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={24} className="text-slate-300" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">
                              {neg.product_details?.name || `Product #${neg.product}`}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest ${
                                neg.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                neg.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                neg.status === 'COUNTER_OFFER' ? 'bg-blue-100 text-blue-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {neg.status.replace('_', ' ')}
                              </span>
                              {!isTurnToAct && neg.status !== 'ACCEPTED' && neg.status !== 'REJECTED' && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  <Clock size={10} /> Waiting for Buyer
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right sm:text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proposed Value</p>
                          <p className="text-2xl font-black text-slate-900">NPR {neg.proposed_price.toLocaleString()}</p>
                          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">{neg.proposed_quantity} units</p>
                        </div>
                      </div>

                      {/* Buyer Note */}
                      <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-4 mb-6">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-100 flex-shrink-0">
                          <User size={18} className="text-slate-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {neg.buyer_details?.full_name || `Buyer @${neg.buyer}`}
                          </p>
                          <p className="text-sm font-medium text-slate-600 italic">
                            {neg.history?.[neg.history.length - 1]?.message || "No special instructions provided."}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1">
                            {new Date(neg.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Turn-based Action Warning */}
                      {!isTurnToAct && neg.status === 'PENDING' && (
                        <div className="mb-4 flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                          <AlertCircle size={14} /> You've already sent an offer. Awaiting buyer's response.
                        </div>
                      )}

                      {counterId === neg.id && (
                        <div className="mb-6 p-5 bg-gradient-to-br from-orange-50 to-white rounded-2xl border-2 border-orange-100 animate-in zoom-in-95 duration-200 shadow-inner">
                          <h4 className="text-sm font-bold text-orange-800 mb-3 uppercase tracking-wider">Send Counter Offer</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Counter Price (NPR)</label>
                              <input
                                type="number"
                                value={counterPrice}
                                onChange={(e) => setCounterPrice(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Counter Quantity</label>
                              <input
                                type="number"
                                value={counterQty}
                                onChange={(e) => setCounterQty(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                              />
                            </div>
                          </div>
                          <div className="mb-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Message to Buyer</label>
                            <textarea
                              value={counterMsg}
                              onChange={(e) => setCounterMsg(e.target.value)}
                              placeholder="e.g., We can offer this price if you buy 100 units..."
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:ring-2 focus:ring-orange-500/20 outline-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              disabled={submitting}
                              onClick={() => handleSendCounter(neg.id)}
                              className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all disabled:opacity-50"
                            >
                              {submitting ? 'Sending...' : 'Send Offer'}
                            </button>
                            <button
                              onClick={() => setCounterId(null)}
                              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                          {(neg.status === 'PENDING' || neg.status === 'COUNTER_OFFER') && isTurnToAct ? (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(neg.id, 'ACCEPTED')}
                                className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all flex items-center gap-2"
                              >
                                <CheckCircle2 size={16} /> Accept
                              </button>
                              <button
                                onClick={() => {
                                  setCounterId(neg.id);
                                  setCounterPrice(neg.proposed_price.toString());
                                  setCounterQty(neg.proposed_quantity.toString());
                                }}
                                className="px-6 py-2 bg-orange-100 text-orange-700 rounded-xl text-sm font-bold hover:bg-orange-200 transition-all flex items-center gap-2"
                              >
                                <MessageCircle size={16} /> Counter
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(neg.id, 'REJECTED')}
                                className="px-6 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-2"
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </>
                          ) : null}
                          
                          {hasHistory && (
                            <button
                              onClick={() => setViewHistoryId(viewHistoryId === neg.id ? null : neg.id)}
                              className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                            >
                              <History size={16} /> History
                            </button>
                          )}
                        </div>

                        <div className="flex gap-4">
                          <Link
                            to={`/marketplace/${neg.product}`}
                            className="text-slate-400 hover:text-orange-600 transition-colors"
                            title="Open Product Page"
                          >
                            <ExternalLink size={20} />
                          </Link>
                          <Link
                            to={`/find-business/${neg.buyer}`}
                            className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-2 group border-b-2 border-transparent hover:border-orange-200"
                          >
                            Buyer Profile <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>

                      {/* History Viewer Overlay (Simple Expandable) */}
                      {viewHistoryId === neg.id && neg.history && (
                        <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Offer History</h4>
                          <div className="relative space-y-4 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            {neg.history.map((h, i) => (
                              <div key={h.id} className="relative flex items-start gap-4 pl-8 group">
                                <div className={`absolute left-3 w-2.5 h-2.5 rounded-full border-2 border-white top-1 ${
                                  h.offer_by === currentUser?.id ? 'bg-orange-500' : 'bg-slate-400'
                                } shadow-sm`} />
                                <div className="flex-1 bg-slate-50/50 rounded-xl p-3 text-xs">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-black text-slate-900">
                                      {h.offer_by === currentUser?.id ? "Your Offer" : "Buyer's Offer"}
                                    </span>
                                    <span className="text-slate-400 font-bold">{new Date(h.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                  <p className="font-bold text-slate-700">NPR {h.price.toLocaleString()} for {h.quantity} units</p>
                                  {h.message && <p className="text-slate-500 mt-1 italic">"{h.message}"</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributorNegotiations;
