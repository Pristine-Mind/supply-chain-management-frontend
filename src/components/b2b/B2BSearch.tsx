import React from 'react';
import { Users, Search, X, Building2, Star, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { useB2BSearch } from './useB2BSearch';
import BusinessCard from './BusinessCard';
import ChatModal from './ChatModal';
import AdvancedFilters from './AdvancedFilters';

const B2BSearch: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { state, actions } = useB2BSearch(open);

  if (!open) return null;

  const recommendedUsers = state.users.filter(u => state.recommendedIds.includes(u.id));
  const otherUsers = state.users.filter(u => !state.recommendedIds.includes(u.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Section */}
        <header className="bg-orange-600 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">B2B Business Directory</h2>
              <p className="text-orange-100 text-sm">
                Comprehensive business search with {state.count.toLocaleString()} verified partners
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* Search Bar */}
        <div className="p-6 border-b bg-gray-50/50">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by business name, owner name, phone number, or description..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
              value={state.query}
              onChange={(e) => actions.setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  actions.applyFilters();
                }
              }}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={state.filters}
          onFiltersChange={actions.handleFiltersChange}
          onApply={actions.applyFilters}
          onClear={actions.clearFilters}
        />

        {/* Results Stats */}
        {state.count > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-blue-700">
                  Showing <strong>{state.users.length}</strong> of <strong>{state.count.toLocaleString()}</strong> businesses
                </span>
                {Object.keys(state.filtersApplied).length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">(filtered results)</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(state.filtersApplied).map(([key, value]) => (
                        <span key={key} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {key.replace('_', ' ')}: {value?.toString()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-blue-600">Page {state.page}</span>
            </div>
          </div>
        )}

        {/* Results Area */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300">
          {state.loading ? (
             <LoadingSkeleton /> 
          ) : state.users.length === 0 ? (
            <EmptyState onClearFilters={actions.clearFilters} hasFilters={Object.keys(state.filters).length > 0} />
          ) : (
            <div className="space-y-12">
              {/* Recommended Partners Section */}
              {recommendedUsers.length > 0 && (
                <section className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 rounded-3xl p-8 border border-orange-100">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl">
                        <Star className="w-6 h-6 text-white fill-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-wider">Recommended Businesses For You</h3>
                        <p className="text-orange-600 text-sm font-medium">Top verified businesses with products from our marketplace</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                        {recommendedUsers.length} {recommendedUsers.length === 1 ? 'Match' : 'Matches'}
                      </span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        AI Recommended
                      </span>
                    </div>
                  </div>
                  
                  {/* Enhanced Grid Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {recommendedUsers.map((u, index) => (
                      <div key={u.id} className="transform hover:scale-105 transition-all duration-300">
                        <BusinessCard 
                          user={u} 
                          isRecommended 
                          onChat={() => actions.setActiveChatUser(u)}
                        />
                        {/* Recommendation Badge */}
                        <div className="mt-3 flex items-center justify-center">
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            #{index + 1} Recommended
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Why Recommended Section */}
                  <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                      Why These Businesses Are Recommended For You
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        B2B verified with products
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Active marketplace sellers
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Quality product catalog
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* All Businesses Section */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-xl">
                      <Building2 className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-500 uppercase tracking-wider">
                        {recommendedUsers.length > 0 ? "All Other Businesses" : "All Verified Businesses"}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {otherUsers.length} {otherUsers.length === 1 ? 'business' : 'businesses'} • {state.count.toLocaleString()} total
                      </p>
                    </div>
                  </div>
                  
                  {/* Results Summary */}
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">
                      Showing {state.users.length} of {state.count.toLocaleString()}
                    </div>
                    {Object.keys(state.filtersApplied).length > 0 && (
                      <div className="text-xs text-blue-600 font-medium">
                        {Object.keys(state.filtersApplied).length} filters active
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherUsers.map(u => (
                    <BusinessCard 
                      key={u.id} 
                      user={u} 
                      onChat={() => actions.setActiveChatUser(u)} 
                    />
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>

        {/* Enhanced Pagination */}
        <footer className="p-4 border-t bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Page {state.page} of {Math.ceil(state.count / 12)}
            </span>
            <span className="text-sm text-gray-500">
              ({state.count.toLocaleString()} total businesses)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <PaginationButton 
              label="Previous" 
              disabled={!state.hasPrevPage} 
              onClick={actions.goToPrevPage}
              icon={<ChevronLeft className="w-4 h-4" />}
            />
            <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg font-bold">
              {state.page}
            </div>
            <PaginationButton 
              label="Next" 
              disabled={!state.hasNextPage} 
              onClick={actions.goToNextPage}
              icon={<ChevronRight className="w-4 h-4" />}
              iconRight
            />
          </div>
        </footer>
      </div>

      {state.activeChatUser && (
        <ChatModal 
          user={state.activeChatUser}
          messages={state.conversation}
          onClose={() => actions.setActiveChatUser(null)}
          onSend={actions.handleSendMessage}
          currentUserId={state.currentUserId}
        />
      )}
    </div>
  );
};

// Sub-components
const PaginationButton = ({ label, icon, iconRight, ...props }: any) => (
  <button 
    {...props} 
    className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg hover:border-orange-500 hover:text-orange-600 disabled:opacity-30 transition-all font-medium"
  >
    {icon && !iconRight && icon}
    {label}
    {icon && iconRight && icon}
  </button>
);

const EmptyState = ({ onClearFilters, hasFilters }: { onClearFilters: () => void; hasFilters: boolean }) => (
  <div className="text-center py-20">
    <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <p className="text-xl font-semibold text-gray-600 mb-2">
      {hasFilters ? 'No businesses match your current filters.' : 'No businesses found.'}
    </p>
    {hasFilters && (
      <button
        onClick={onClearFilters}
        className="text-orange-600 hover:text-orange-700 font-medium underline"
      >
        Clear all filters to see all businesses
      </button>
    )}
  </div>
);

const LoadingSkeleton = () => (
    <div className="grid grid-cols-3 gap-6 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}
    </div>
);

export default B2BSearch;