import React from 'react';
import { FiMessageSquare, FiUser, FiInfo } from 'react-icons/fi';

interface MessageProps {
  type?: 'user' | 'bot' | 'info';
  message: string;
  timestamp?: string;
  className?: string;
}

const Message: React.FC<MessageProps> = ({
  type = 'bot',
  message,
  timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  className = '',
}) => {
  const isUser = type === 'user';
  const isBot = type === 'bot';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${className}`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-3">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isBot ? 'bg-blue-500' : 'bg-yellow-400'
            }`}
          >
            {isBot ? (
              <FiMessageSquare className="text-white" />
            ) : (
              <FiInfo className="text-white" />
            )}
          </div>
        </div>
      )}
      
      <div 
        className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
          isUser 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : isBot 
              ? 'bg-gray-100 text-gray-800 rounded-bl-none'
              : 'bg-yellow-50 text-yellow-800 border border-yellow-100'
        }`}
      >
        <div className="text-sm">{message}</div>
        <div 
          className={`text-xs mt-1 text-right ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {timestamp}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 ml-3">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <FiUser className="text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;
