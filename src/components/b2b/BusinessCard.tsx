import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Star, 
  ArrowRight, 
  MessageCircle, 
  Shield, 
  Calendar
} from 'lucide-react';
import { B2BUser } from '../../api/b2bApi';

interface CardProps {
  user: B2BUser;
  isRecommended?: boolean;
  onChat: () => void;
}

const BusinessCard: React.FC<CardProps> = ({ user, isRecommended, onChat }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
    } catch {
      return '';
    }
  };

  return (
    <div 
      className="group bg-white rounded-2xl border-2 border-slate-100 hover:border-orange-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full"
    >
      {/* Visual Header */}
      <div className={`p-4 flex justify-between items-center ${isRecommended ? 'bg-orange-50' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isRecommended ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-600'}`}>
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-tight text-slate-500">
            {user.business_type || 'Business'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {user.b2b_verified && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
              <Shield className="w-3 h-3" />
              Verified
            </div>
          )}
          {isRecommended && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase">
              <Star className="w-3 h-3 fill-current" />
              Top Match
            </div>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Business Name & Owner */}
        <h4 className="text-lg font-bold text-slate-800 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {user.username}
        </h4>
        
        <div className="flex items-center gap-1.5 text-slate-500 mb-3">
          <User className="w-3.5 h-3.5" />
          <span className="text-sm">{user.username}</span>
        </div>

        {/* Business Details */}
        <div className="space-y-2 mb-4 flex-1">
          {/* Registration Date */}
          {user.date_joined && (
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-sm">
                Member since {formatDate(user.date_joined)}
              </span>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 mb-4">
          {user.is_active ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Inactive
            </span>
          )}
          
          {user.role_name && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {user.role_name}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/find-business/${user.id}`)}
            className="flex items-center justify-center gap-2 py-2.5 bg-orange-700 text-white rounded-xl hover:bg-orange-600 transition-all text-sm font-semibold"
          >
            View Profile <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onChat(); }}
            className="flex items-center justify-center gap-2 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-all text-sm font-semibold"
          >
            <MessageCircle className="w-4 h-4" /> Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessCard;
