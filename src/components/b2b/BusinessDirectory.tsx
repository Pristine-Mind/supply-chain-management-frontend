import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Building2, Star, ChevronLeft, ChevronRight, TrendingUp, ArrowLeft } from 'lucide-react';
import { useB2BSearch } from './useB2BSearch';
import BusinessCard from './BusinessCard';
import ChatModal from './ChatModal';
import AdvancedFilters from './AdvancedFilters';

const BusinessDirectory: React.FC = () => {
  const { state, actions } = useB2BSearch(true); // Always open for full page

  const recommendedUsers = state.users.filter(u => state.recommendedIds.includes(u.id));
  const otherUsers = state.users.filter(u => !state.recommendedIds.includes(u.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-blue-50/30">
      
      {/* Header Section */}
      <header className="bg-gradient-to-r from-orange-600 to-red-500 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link 
                to="/find-business"
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">B2B Business Directory</h1>
                  <p className="text-orange-100 text-lg">
                    Discover {state.count.toLocaleString()} verified business partners
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats Display */}
            <div className="hidden lg:flex items-center gap-6 text-white">
              <div className="text-center">
                <div className="text-2xl font-bold">{state.count.toLocaleString()}</div>
                <div className="text-orange-100 text-sm">Total Partners</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{recommendedUsers.length}</div>
                <div className="text-orange-100 text-sm">Recommended</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <section className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by business name, owner name, phone number, or description..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-lg"
              value={state.query}
              onChange={(e) => actions.setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  actions.fetchUsers();
                }
              }}
            />
          </div>
        </div>
      </section>

      {/* Advanced Filters */}
      <section className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <AdvancedFilters
            filters={state.filters}
            onFiltersChange={actions.handleFiltersChange}
            onApply={actions.applyFilters}
            onClear={actions.clearFilters}
          />
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-12">
          
          {/* Loading State */}
          {state.loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          )}

          {/* Recommended Partners Section */}
          {!state.loading && recommendedUsers.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl">
                    <Star className="w-6 h-6 text-white fill-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Recommended Businesses For You</h2>
                    <p className="text-orange-600 text-lg">Top verified businesses with products from our marketplace</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full text-lg font-bold">
                    {recommendedUsers.length} {recommendedUsers.length === 1 ? 'Match' : 'Matches'}
                  </span>
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    AI Curated
                  </span>
                </div>
              </div>
              
              {/* Recommended Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recommendedUsers.map((user, index) => (
                  <div key={user.id} className="relative">
                    <BusinessCard 
                      user={user} 
                      isRecommended 
                      onChat={() => actions.setActiveChatUser(user)}
                    />
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                      #{index + 1} Recommended
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Why Recommended Section */}
              <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-orange-500" />
                  Why These Businesses Are Recommended For You
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>B2B verified with products</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Active marketplace sellers</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Quality product catalog</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* All Businesses Section */}
          {!state.loading && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <Building2 className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {recommendedUsers.length > 0 ? "All Other Businesses" : "All Verified Businesses"}
                    </h2>
                    <p className="text-gray-600 text-lg">Browse the complete directory</p>
                  </div>
                </div>
                
                <span className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full text-lg font-semibold">
                  {otherUsers.length.toLocaleString()} {otherUsers.length === 1 ? 'Business' : 'Businesses'}
                </span>
              </div>
              
              {/* Business Grid */}
              {otherUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {otherUsers.map((user) => (
                    <BusinessCard 
                      key={user.id} 
                      user={user} 
                      onChat={() => actions.setActiveChatUser(user)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No businesses found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters</p>
                </div>
              )}
            </section>
          )}

          {/* Pagination */}
          {!state.loading && (state.hasNextPage || state.hasPrevPage) && (
            <div className="flex items-center justify-center gap-4 py-8">
              <button
                onClick={() => actions.goToPrevPage()}
                disabled={!state.hasPrevPage}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>
              
              <span className="px-6 py-3 bg-orange-100 text-orange-700 rounded-xl font-semibold">
                Page {state.page}
              </span>
              
              <button
                onClick={() => actions.goToNextPage()}
                disabled={!state.hasNextPage}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Chat Modal */}
      {state.activeChatUser && (
        <ChatModal
          user={state.activeChatUser}
          messages={state.conversation}
          currentUserId={state.currentUserId}
          onClose={() => actions.setActiveChatUser(null)}
          onSend={actions.handleSendMessage}
        />
      )}
    </div>
  );
};

export default BusinessDirectory;