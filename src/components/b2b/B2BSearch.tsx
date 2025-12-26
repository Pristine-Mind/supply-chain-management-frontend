import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listB2BUsers, B2BUser, getRecommendedBusinesses } from '../../api/b2bApi';
import { Users, Search, Building2, Mail, User, ArrowRight, X, Send, MessageCircle, Star } from 'lucide-react';
import { getSellerConversation, sendSellerMessage } from '../../api/chatApi';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: number;
  sender: number;
  sender_details: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  target_user: number;
  target_user_details: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  subject?: string;
  message: string;
  timestamp: string;
  is_read?: boolean;
}

const B2BSearch: React.FC<Props> = ({ open, onClose }) => {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<B2BUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  // Chat state for seller-level conversations
  const [activeChatUser, setActiveChatUser] = useState<B2BUser | null>(null);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [sellerMsg, setSellerMsg] = useState('');
  const [sendingSellerMsg, setSendingSellerMsg] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [recommendedIds, setRecommendedIds] = useState<number[]>([]);

  // Get current user ID once
  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

  useEffect(() => {
    if (!open) return;
    fetchUsers();
    fetchRecommendations();
  }, [open, page]);

  const fetchRecommendations = async () => {
    try {
      const data = await getRecommendedBusinesses();
      if (Array.isArray(data)) {
        setRecommendedIds(data.map((r: any) => Number(r.user_id)).filter(Boolean));
      }
    } catch (e) {
      console.error('fetchRecommendations', e);
      setRecommendedIds([]);
    }
  };

  const recommendedUsersList = users.filter(u => recommendedIds.includes(u.id));
  const otherUsersList = users.filter(u => !recommendedIds.includes(u.id));

  const fetchUsers = async (qParam?: string, pageParam = page) => {
    setLoading(true);
    try {
      const data = await listB2BUsers((qParam ?? q) || undefined, pageParam, pageSize);
      setUsers(data.results || []);
      setCount(data.count || 0);
    } catch (e) {
      console.error('Error fetching b2b users', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setPage(1);
    await fetchUsers(q, 1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const fetchConversation = async (sellerId: number) => {
    setConvLoading(true);
    try {
      const data = await getSellerConversation(sellerId);
      const messages = data.results || data || [];
      const sorted = messages.sort((a: ChatMessage, b: ChatMessage) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setConversation(sorted);
    } catch (e) {
      console.error('fetchConversation', e);
      setConversation([]);
    } finally {
      setConvLoading(false);
    }
  };

  const openChat = (user: B2BUser) => {
    setActiveChatUser(user);
    setSellerMsg('');
    setSendError(null);
    fetchConversation(user.id);
  };

  const sendMessageToSeller = async () => {
    if (!activeChatUser) return;
    if (!sellerMsg.trim()) return;

    const messageText = sellerMsg.trim();
    setSellerMsg('');

    try {
      setSendingSellerMsg(true);
      setSendError(null);

      const optimisticMsg = {
        id: Date.now(),
        sender: currentUserId,
        sender_details: {
          id: currentUserId,
          username: localStorage.getItem('username') || 'You',
          first_name: '',
          last_name: ''
        },
        target_user: activeChatUser.id,
        target_user_details: {
          id: activeChatUser.id,
          username: activeChatUser.username,
          first_name: activeChatUser.first_name || '',
          last_name: activeChatUser.last_name || ''
        },
        message: messageText,
        timestamp: new Date().toISOString(),
      } as ChatMessage;

      setConversation(prev => [...prev, optimisticMsg]);

      await sendSellerMessage(activeChatUser.id, messageText);
      fetchConversation(activeChatUser.id);
    } catch (e: any) {
      console.error('sendMessageToSeller', e);
      setSendError(e?.response?.data?.error || 'Failed to send message. Please try again.');
      setConversation(prev => prev.filter(msg => msg.id !== Date.now()));
      setSellerMsg(messageText);
    } finally {
      setSendingSellerMsg(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessageToSeller();
    }
  };

  const renderBusinessCard = (user: B2BUser, isRecommended: boolean = false) => (
    <div
      key={user.id}
      className="bg-white rounded-xl border-2 border-gray-100 hover:border-orange-300 hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
      onClick={() => navigate(`/find-business/${user.id}`)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-orange-600" />
          <span className="text-sm font-medium text-orange-800">
            {user.business_type || 'Business'}
          </span>
        </div>
        {isRecommended && (
          <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Recommended
          </span>
        )}
      </div>

      {/* Business Name */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">
          {user.registered_business_name || `${user.first_name} ${user.last_name}`}
        </h3>

        {/* Info Grid */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm">@{user.username}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/find-business/${user.id}`);
            }}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
          >
            View Profile
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openChat(user);
            }}
            className="px-4 py-2.5 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-all font-medium flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Message
          </button>
        </div>
      </div>
    </div>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8" />
              <h2 className="text-3xl font-bold">B2B Businesses</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-orange-100">Discover and connect with business partners</p>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b-2 border-gray-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                const val = e.target.value;
                setQ(val);
                if (val === '') {
                  setPage(1);
                  fetchUsers('', 1);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder="Search by business name, username, or email..."
              className="w-full pl-12 pr-32 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all text-lg shadow-sm"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Search
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 text-lg">Loading businesses...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Building2 className="w-20 h-20 text-gray-300 mb-4" />
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No businesses found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              {/* Recommended Section */}
              {recommendedUsersList.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-6 h-6 text-yellow-500 fill-current" />
                    <h3 className="text-2xl font-bold text-gray-900">Recommended for You</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedUsersList.map(user => renderBusinessCard(user, true))}
                  </div>
                </div>
              )}

              {/* All Businesses Section */}
              {otherUsersList.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-6 h-6 text-gray-600" />
                    <h3 className="text-2xl font-bold text-gray-900">
                      {recommendedUsersList.length > 0 ? 'Other Businesses' : 'All Businesses'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {otherUsersList.map(user => renderBusinessCard(user, false))}
                  </div>
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-gray-100">
                <p className="text-gray-600 font-medium">
                  Showing {users.length} of {count} businesses
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-5 py-2.5 border-2 border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:border-orange-500 hover:bg-orange-50 transition-colors font-medium text-gray-700"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-bold">
                    {page}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
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

      {/* Seller Chat Modal */}
      {activeChatUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-5 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">
                    {activeChatUser.registered_business_name || `${activeChatUser.first_name} ${activeChatUser.last_name}`}
                  </h3>
                  <p className="text-orange-100 text-sm">
                    {activeChatUser.business_type} • @{activeChatUser.username}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveChatUser(null);
                    setSendError(null);
                  }}
                  className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {convLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-3"></div>
                  <p className="text-gray-600">Loading messages...</p>
                </div>
              ) : conversation.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mb-3" />
                  <h4 className="text-lg font-semibold text-gray-700 mb-1">No messages yet</h4>
                  <p className="text-gray-500 text-sm">
                    Start the conversation with {activeChatUser.username}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversation.map(msg => {
                    const isSentByMe = msg.sender === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            isSentByMe
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                              : 'bg-white border-2 border-gray-200 text-gray-800'
                          }`}
                        >
                          {msg.subject && (
                            <div className={`font-semibold mb-1 pb-2 border-b ${isSentByMe ? 'border-orange-400' : 'border-gray-200'}`}>
                              {msg.subject}
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          <p className={`text-xs mt-2 ${isSentByMe ? 'text-orange-100' : 'text-gray-500'}`}>
                            {new Date(msg.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message Input Area */}
            <div className="p-4 bg-white border-t-2 border-gray-100 rounded-b-2xl">
              {sendError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {sendError}
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  value={sellerMsg}
                  onChange={(e) => setSellerMsg(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Type your message... (Press Enter to send)"
                  className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm resize-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all"
                  rows={3}
                  disabled={sendingSellerMsg}
                />
                <button
                  onClick={sendMessageToSeller}
                  disabled={sendingSellerMsg || !sellerMsg.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingSellerMsg ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default B2BSearch;
