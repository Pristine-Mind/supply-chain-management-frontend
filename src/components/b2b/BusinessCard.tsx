import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Star, ArrowRight, MessageCircle } from 'lucide-react';
import { B2BUser } from '../../api/b2bApi';

interface CardProps {
  user: B2BUser;
  isRecommended?: boolean;
  onChat: () => void;
}

const BusinessCard: React.FC<CardProps> = ({ user, isRecommended, onChat }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="group bg-white rounded-2xl border-2 border-slate-100 hover:border-orange-400 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Visual Header */}
      <div className={`p-4 flex justify-between items-center ${isRecommended ? 'bg-orange-50' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isRecommended ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-600'}`}>
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-tight text-slate-500">
            {user.business_type || 'Corporation'}
          </span>
        </div>
        {isRecommended && (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase">
            <Star className="w-3 h-3 fill-current" />
            Top Match
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h4 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
          {user.registered_business_name || `${user.first_name} ${user.last_name}`}
        </h4>
        <div className="flex items-center gap-1.5 text-slate-500 mb-6">
          <User className="w-3.5 h-3.5" />
          <span className="text-sm">@{user.username}</span>
        </div>

        {/* Buttons */}
        <div className="mt-auto grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/find-business/${user.id}`)}
            className="flex items-center justify-center gap-2 py-2.5 bg-orange-700 text-white rounded-xl hover:bg-orange-600 transition-all text-sm font-semibold"
          >
            Profile <ArrowRight className="w-4 h-4" />
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
