import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, X, Building2, Star } from 'lucide-react';
import { useB2BSearch } from './useB2BSearch';
import BusinessCard from './BusinessCard';
import ChatModal from './ChatModal';

const B2BSearch: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const navigate = useNavigate();
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
              <h2 className="text-2xl font-bold">B2B Directory</h2>
              <p className="text-orange-100 text-sm">Find and message verified partners</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* Sticky Search Bar */}
        <div className="p-6 border-b bg-gray-50/50">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by business name, niche, or username..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
              value={state.query}
              onChange={(e) => actions.setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && actions.fetchUsers()}
            />
          </div>
        </div>

        {/* Results Area */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300">
          {state.loading ? (
             <LoadingSkeleton /> 
          ) : state.users.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-12">
              {recommendedUsers.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-6 text-orange-700">
                    <Star className="w-5 h-5 fill-orange-500" />
                    <h3 className="text-lg font-bold uppercase tracking-wider">Recommended Partners</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedUsers.map(u => (
                      <BusinessCard 
                        key={u.id} 
                        user={u} 
                        isRecommended 
                        onChat={() => actions.setActiveChatUser(u)} 
                      />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-lg font-bold text-gray-500 mb-6 uppercase tracking-wider">
                  {recommendedUsers.length > 0 ? "All Other Businesses" : "Verified Businesses"}
                </h3>
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

        {/* Footer Pagination */}
        <footer className="p-4 border-t bg-white flex items-center justify-between">
          <span className="text-sm text-gray-500">Showing {state.users.length} of {state.count}</span>
          <div className="flex gap-2">
            <PaginationButton 
                label="Prev" 
                disabled={state.page === 1} 
                onClick={() => actions.setPage(p => p - 1)} 
            />
            <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg font-bold">{state.page}</div>
            <PaginationButton 
                label="Next" 
                disabled={state.page * 12 >= state.count} 
                onClick={() => actions.setPage(p => p + 1)} 
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

// Sub-components (Simplified for brevity)
const PaginationButton = ({ label, ...props }: any) => (
    <button {...props} className="px-4 py-2 border-2 rounded-lg hover:border-orange-500 hover:text-orange-600 disabled:opacity-30 transition-all font-medium">
        {label}
    </button>
);

const EmptyState = () => (
    <div className="text-center py-20">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-xl font-semibold text-gray-600">No businesses match your search.</p>
    </div>
);

const LoadingSkeleton = () => (
    <div className="grid grid-cols-3 gap-6 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}
    </div>
);

export default B2BSearch;