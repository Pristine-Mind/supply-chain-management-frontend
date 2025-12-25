import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listB2BUsers, B2BUser } from '../../api/b2bApi';
import { Users, Search, Building2, Mail, User, ArrowRight, X, Send, MessageCircle } from 'lucide-react';
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

  // Get current user ID once
  const currentUserId = parseInt(localStorage.getItem('user_id') || '0');

  useEffect(() => {
    if (!open) return;
    fetchUsers();
  }, [open, page]);

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
      // Use the new API endpoint that fetches conversation with specific user
      const data = await getSellerConversation(sellerId);
      const messages = data.results || data || [];
      // Sort by timestamp ascending (oldest first)
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
    setSellerMsg(''); // Clear input immediately
    
    try {
      setSendingSellerMsg(true);
      setSendError(null);
      
      // Create optimistic message
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
      
      // Add optimistic message immediately
      setConversation(prev => [...prev, optimisticMsg]);

      // Send to server
      await sendSellerMessage(activeChatUser.id, messageText);
      
      // Refresh conversation to get the actual server message
      fetchConversation(activeChatUser.id);
    } catch (e: any) {
      console.error('sendMessageToSeller', e);
      setSendError(e?.response?.data?.error || 'Failed to send message. Please try again.');
      // Remove the optimistic message on error
      setConversation(prev => prev.filter(msg => msg.id !== Date.now()));
      // Restore the message in the input
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-50 to-orange-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-xl shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">B2B Businesses</h3>
              <p className="text-sm text-gray-600">Discover and connect with business partners</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors group"
          >
            <X className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b bg-white">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={q}
              onChange={e => {
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
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Search
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading businesses...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="p-6 bg-gray-200 rounded-full mb-4">
                <Building2 className="w-20 h-20 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-700">No businesses found</p>
              <p className="text-sm mt-2">Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                  <div
                    key={user.id}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-500 hover:shadow-xl transition-all duration-300 group"
                  >
                    {/* Header */}
                    <div 
                      className="cursor-pointer"
                      onClick={() => navigate(`/find-business/${user.id}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-600 transition-colors">
                          <Building2 className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors" />
                        </div>
                        <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold">
                          {user.business_type || 'Business'}
                        </span>
                      </div>
                      
                      {/* Business Name */}
                      <h4 className="text-xl font-bold text-gray-800 mb-3 line-clamp-1 group-hover:text-orange-600 transition-colors">
                        {user.registered_business_name || `${user.first_name} ${user.last_name}`}
                      </h4>
                      
                      {/* Info Grid */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="line-clamp-1">@{user.username}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="line-clamp-1">{user.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button 
                        className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        onClick={() => navigate(`/find-business/${user.id}`)}
                      >
                        View Profile
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        className="w-full py-2.5 bg-white border-2 border-orange-200 rounded-lg text-sm text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all font-medium flex items-center justify-center gap-2"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          openChat(user); 
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message Seller
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-gray-200 gap-4 bg-white rounded-xl p-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-bold text-orange-600">{users.length}</span> of <span className="font-bold text-orange-600">{count}</span> businesses
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page === 1} 
                    className="px-5 py-2.5 border-2 border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:border-orange-500 hover:bg-orange-50 transition-colors font-medium text-gray-700"
                  >
                    Previous
                  </button>
                  <div className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-bold shadow-md">
                    {page}
                  </div>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => {
              setActiveChatUser(null);
              setSendError(null);
            }}
          ></div>
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-600 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {activeChatUser.registered_business_name || `${activeChatUser.first_name} ${activeChatUser.last_name}`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {activeChatUser.business_type} • @{activeChatUser.username}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setActiveChatUser(null);
                  setSendError(null);
                }} 
                className="p-2 rounded-lg hover:bg-white transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-3">
              {convLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading messages...</p>
                  </div>
                </div>
              ) : conversation.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <MessageCircle className="w-16 h-16 text-gray-300 mb-3" />
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm">Start the conversation with {activeChatUser.username}</p>
                </div>
              ) : (
                conversation.map(msg => {
                  // Fixed: Check if the sender of this message is the current user
                  const isSentByMe = msg.sender === currentUserId;
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-xl p-4 ${
                        isSentByMe 
                          ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white' 
                          : 'bg-white border border-gray-200'
                      }`}>
                        {msg.subject && (
                          <div className={`font-semibold mb-1 ${isSentByMe ? 'text-white' : 'text-gray-800'}`}>
                            {msg.subject}
                          </div>
                        )}
                        <div className={`text-sm ${isSentByMe ? 'text-white' : 'text-gray-700'}`}>
                          {msg.message}
                        </div>
                        <div className={`text-xs mt-2 ${isSentByMe ? 'text-orange-100' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Area */}
            <div className="p-4 border-t bg-white">
              {sendError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {sendError}
                </div>
              )}
              <div className="flex gap-3">
                <textarea
                  value={sellerMsg}
                  onChange={e => setSellerMsg(e.target.value)}
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
