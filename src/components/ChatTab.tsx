import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Message {
  id: number;
  sender: number;
  product: number;
  message: string;
  timestamp: string;
  sender_details: {
    id: number;
    username: string;
  };
}

interface ChatTabProps {
  productId: number;
  isAuthenticated: boolean;
}

const ChatTab: React.FC<ChatTabProps> = ({ productId, isAuthenticated }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/chats/?product=${productId}`,
        { headers }
      );
      setMessages(response.data.results || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAuthenticated) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/chats/`,
        {
          product: productId,
          message: newMessage.trim(),
        },
        {
          headers: { 
            'Authorization': `Token ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [productId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {isLoading ? (
            <div className="flex justify-center p-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No messages yet.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_details.id === parseInt(localStorage.getItem('user_id') || '0') ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender_details.id === parseInt(localStorage.getItem('user_id') || '0')
                        ? 'bg-yellow-100 rounded-tr-none'
                        : 'bg-white border rounded-tl-none'
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {msg.sender_details.username} • {new Date(msg.timestamp).toLocaleString()}
                    </div>
                    <p className="text-gray-800">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t p-4 bg-white">
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-yellow-700">Please log in to send a message</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="mt-2 px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors text-sm"
            >
              Log In to Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_details.id === parseInt(localStorage.getItem('user_id') || '0') ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender_details.id === parseInt(localStorage.getItem('user_id') || '0')
                      ? 'bg-yellow-100 rounded-tr-none'
                      : 'bg-white border rounded-tl-none'
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {msg.sender_details.username} • {new Date(msg.timestamp).toLocaleString()}
                  </div>
                  <p className="text-gray-800">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <form onSubmit={sendMessage} className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={!isAuthenticated}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isAuthenticated}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatTab;
