import React, { useState, useCallback, useEffect } from 'react';
import ForYouGrid from './ForYouGrid';
import MyFollowing from './MyFollowing';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import { getUserData } from '../utils/auth';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Mic, ArrowLeft, LayoutGrid, Smartphone } from 'lucide-react';
import CreatorsList from './CreatorsList';
import ShoppableCategories from './ShoppableCategories';
import { shoppableVideosApi } from '../api/shoppableVideosApi';
import { ShoppableCategory } from '../types/shoppableVideo';

const ForYouPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'for_you' | 'following' | 'store'>('for_you');
  const [viewMode, setViewMode] = useState<'grid' | 'reels'>('reels');
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<ShoppableCategory[]>([
    { id: 1, name: 'Trending', slug: 'trending', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200' },
    { id: 2, name: 'Active', slug: 'active', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200' },
    { id: 3, name: 'Beauty', slug: 'beauty', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200' },
    { id: 4, name: 'Fashion', slug: 'fashion', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200' },
    { id: 5, name: 'Home', slug: 'home', image: 'https://images.unsplash.com/photo-1484101403033-5710672509bb?w=200' }
  ]);
  const [selectedCategory, setSelectedCategory] = useState<ShoppableCategory | null>(null);
  const { isAuthenticated, user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    shoppableVideosApi.getCategories()
      .then(data => {
        if (data && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch categories', err);
      });
  }, []);

  // Memoized navigation logic to prevent unnecessary re-renders
  const handleStoreClick = useCallback(() => {
    const creatorId = (user && (user.id || user.shopId)) || null;
    if (isAuthenticated && creatorId) {
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
          {activeTab === 'for_you' && (
            <>
              {categories.length > 0 && (
                <ShoppableCategories 
                  categories={categories} 
                  onSelect={(cat) => {
                    if (cat.id === 0) setSelectedCategory(null);
                    else {
                      setSelectedCategory(cat);
                      setActiveTab('store');
                    }
                  }}
                  selectedCategoryId={selectedCategory?.id}
                />
              )}
              <ForYouGrid query={query} viewMode={viewMode} />
            </>
          )}
          {activeTab === 'following' && <MyFollowing />}
          {activeTab === 'store' && (
            <div>
              {categories.length > 0 && (
                <div className="mb-8 border-b border-neutral-100 pb-8">
                  <ShoppableCategories 
                    categories={categories} 
                    onSelect={(cat) => setSelectedCategory(cat.id === 0 ? null : cat)}
                    selectedCategoryId={selectedCategory?.id}
                  />
                </div>
              )}
              <CreatorsList selectedCategory={selectedCategory?.id ? String(selectedCategory.id) : undefined} />
            </div>
          )}
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
