import React, { useState, useCallback } from 'react';
import ForYouGrid from './ForYouGrid';
import MyFollowing from './MyFollowing';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import { getUserData } from '../utils/auth';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Mic, ArrowLeft, LayoutGrid, Smartphone } from 'lucide-react';
import CreatorsList from './CreatorsList';

const ForYouPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'for_you' | 'following' | 'store'>('for_you');
  const [viewMode, setViewMode] = useState<'grid' | 'reels'>('reels');
  const [query, setQuery] = useState('');
  const { isAuthenticated, user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Memoized navigation logic to prevent unnecessary re-renders
  const handleStoreClick = useCallback(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    const creatorId = (user && (user.id || user.shopId)) || null;
    if (creatorId) {
      navigate(`/creators/${creatorId}`);
    } else {
      setActiveTab('store');
    }
  }, [isAuthenticated, user, navigate]);

  const handlePostLoginNavigate = () => {
    setShowLoginModal(false);
    const u = getUserData();
    const creatorId = (u && (u.id || u.shopId)) || null;
    if (creatorId) navigate(`/creators/${creatorId}`);
    else setActiveTab('store');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Top Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
               <button 
                onClick={() => navigate(-1)} 
                className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-neutral-200"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600" />
              </button>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Just For You</h1>
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex bg-neutral-200/50 backdrop-blur-sm p-1 rounded-xl shadow-inner border border-neutral-200 ml-0 md:ml-4">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('reels')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'reels' ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                title="Reels View"
              >
                <Smartphone className="w-5 h-5" />
              </button>
            </div>

            {/* Premium Tab Selector */}
            <div className="inline-flex bg-neutral-200/50 backdrop-blur-sm p-1 rounded-xl shadow-inner border border-neutral-200">
              {[
                { id: 'for_you', label: 'For You' },
                { id: 'following', label: 'Following' },
                { id: 'store', label: 'Store' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => tab.id === 'store' ? handleStoreClick() : setActiveTab(tab.id as any)}
                  className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Section */}
          <div className="flex-1 max-w-2xl flex items-center gap-3">
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="text-neutral-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search creators, style, videos..."
                className="w-full bg-white border border-neutral-200 rounded-2xl pl-12 pr-24 py-3 text-neutral-800 placeholder:text-neutral-400 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
              />
              <div className="absolute right-2 inset-y-2 flex items-center gap-1">
                <button className="p-2 text-neutral-400 hover:text-primary-500 transition-colors hidden sm:block">
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {/* Trigger search */}}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Display Area */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'for_you' && <ForYouGrid query={query} viewMode={viewMode} />}
          {activeTab === 'following' && <MyFollowing />}
          {activeTab === 'store' && <CreatorsList />}
        </div>

        {/* Auth Modals */}
        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onSuccess={handlePostLoginNavigate}
          />
        )}
      </div>
    </div>
  );
};

export default ForYouPage;
