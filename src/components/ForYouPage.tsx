import React, { useState } from 'react';
import ForYouGrid from './ForYouGrid';
import MyFollowing from './MyFollowing';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import { getUserData } from '../utils/auth';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Mic } from 'lucide-react';
import CreatorsList from './CreatorsList';

const ForYouPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'for_you' | 'following' | 'store'>('for_you');
  const [query, setQuery] = useState('');
  const { isAuthenticated, user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handlePostLoginNavigate = () => {
    setShowLoginModal(false);
    // try to read latest user data from localStorage
    const u = getUserData();
    const creatorId = (u && (u.id || u.shopId)) || null;
    if (creatorId) navigate(`/creators/${creatorId}`);
    else navigate('/creators');
    setActiveTab('store');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto container-padding py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <h2 className="text-lg sm:text-xl font-semibold">Just For You</h2>
            <div className="inline-flex bg-white rounded-full p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('for_you')}
                className={`px-3 py-1 rounded-full text-sm ${activeTab === 'for_you' ? 'bg-primary-100 text-primary-700' : 'text-neutral-600'}`}
              >
                For You
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`px-3 py-1 rounded-full text-sm ${activeTab === 'following' ? 'bg-primary-100 text-primary-700' : 'text-neutral-600'}`}
              >
                Following
              </button>
              <button
                onClick={() => {
                  // open creator profile: if not authenticated, prompt login
                  if (!isAuthenticated) {
                    setShowLoginModal(true);
                    return;
                  }
                  // prefer navigating to user's creator profile if id available
                  const creatorId = (user && (user.id || user.shopId)) || null;
                  if (creatorId) navigate(`/creators/${creatorId}`);
                  else navigate('/creators');
                  setActiveTab('store');
                }}
                className={`px-3 py-1 rounded-full text-sm ${activeTab === 'store' ? 'bg-primary-100 text-primary-700' : 'text-neutral-600'}`}
              >
                Store
              </button>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <div className="relative w-full sm:w-[420px] bg-white border border-neutral-200 rounded-full px-3 py-2 flex items-center"> 
              <MagnifyingGlassIcon className="text-neutral-400 w-5 h-5 mr-3" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search creators, videos..."
                className="w-full bg-transparent text-base sm:text-lg placeholder:text-neutral-400 outline-none"
              />
              <button className="ml-2 p-2 rounded-full hover:bg-neutral-100 transition-colors">
                <Mic className="w-5 h-5 text-neutral-500" />
              </button>
              <button 
                onClick={() => setQuery(query)} 
                className="ml-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-md"
              >
                Search
              </button>
            </div>
            <div>
              <button onClick={() => navigate(-1)} className="btn px-3 py-1">Back</button>
            </div>
          </div>
        </div>
        {activeTab === 'for_you' && <ForYouGrid query={query} />}
        {activeTab === 'following' && <MyFollowing />}
        {activeTab === 'store' && <CreatorsList/> }
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