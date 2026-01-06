import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { B2BUser } from '../../api/b2bApi';

interface ChatProps {
  user: B2BUser;
  messages: any[];
  currentUserId: number;
  onClose: () => void;
  onSend: (msg: string) => Promise<void>;
}

const ChatModal: React.FC<ChatProps> = ({ user, messages, currentUserId, onClose, onSend }) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    setIsSending(true);
    try {
      await onSend(input);
      setInput('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col h-[600px] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-800 leading-none">
                {user.registered_business_name || user.username}
              </p>
              <span className="text-xs text-green-500 font-medium tracking-wide">● Online</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Message List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm italic">No history yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender === currentUserId;
              return (
                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isMe 
                    ? 'bg-orange-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}>
                    {msg.message}
                    <p className={`text-[10px] mt-1 opacity-70 text-right`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t">
          <div className="relative flex items-center">
            <input
              autoFocus
              className="w-full pl-4 pr-14 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all"
              placeholder="Write a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="absolute right-2 p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
