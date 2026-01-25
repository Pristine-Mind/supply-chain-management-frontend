/**
 * Voice Search Integration Example
 * Shows how to use the agentic voice search system in a marketplace component
 */

import React, { useState, useEffect } from 'react';
import { FiMic, FiX } from 'react-icons/fi';
import useVoiceSearch from '../hooks/useVoiceSearch';
import VoiceSearchResults from './VoiceSearchResults';
import { UserInteraction } from '../types/voiceSearch';

/**
 * Example component integrating agentic voice search
 * Provides a complete marketplace search interface with voice, intent parsing, and personalization
 */
export const VoiceSearchExample: React.FC = () => {
  const userId = parseInt(localStorage.getItem('user_id') || '0');
  const [userInteractions, setUserInteractions] = useState<UserInteraction[] | null>(null);

  // Initialize user interaction history (normally fetched from API)
  useEffect(() => {
    const fetchUserInteractions = async () => {
      try {
        // Example: fetch from API
        // const response = await axios.get(`/api/user/${userId}/interactions/`);
        // setUserInteractions(response.data);

        // For now, mock data
        setUserInteractions([
          {
            user_id: userId,
            product_id: 1,
            category_id: 5,
            brand_id: 10,
            interaction_type: 'view',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          },
          {
            user_id: userId,
            product_id: 2,
            category_id: 5,
            brand_id: 10,
            interaction_type: 'purchase',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Error fetching user interactions:', error);
      }
    };

    if (userId) {
      fetchUserInteractions();
    }
  }, [userId]);

  // Initialize voice search hook
  const {
    query,
    setQuery,
    isListening,
    isSearching,
    results,
    error,
    lastIntent,
    totalResults,
    currentPage,
    totalPages,
    intentExplanation,
    startListening,
    stopListening,
    performSearch,
    performB2BSearch,
    performLocalSearch,
    performUrgentSearch,
    clearResults,
    goToPage,
  } = useVoiceSearch({
    enableSpeechRecognition: true,
    autoSearch: false, // Don't auto-search on voice input
    language: 'en-US',
    userId: userId || undefined,
    userInteractions,
    onError: (error) => {
      console.error('Voice search error:', error);
    },
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch();
  };

  const handleProductClick = (product: any) => {
    // Navigate to product detail page
    console.log('Product clicked:', product);
  };

  const handleAddToCart = (product: any) => {
    // Add to cart logic
    console.log('Added to cart:', product);
  };

  return (
    <div className="bg-white">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products (try: 'bulk office chairs under $500')"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    isListening
                      ? 'border-red-400 ring-4 ring-red-100'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100'
                  }`}
                  disabled={isListening}
                />

                {/* Clear Button */}
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      clearResults();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Voice Button */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  isListening
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice search'}
              >
                <FiMic className="w-5 h-5" />
                {isListening ? 'Listening...' : 'Voice'}
              </button>

              {/* Search Button */}
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Quick Search Buttons */}
            <div className="flex flex-wrap gap-2 text-sm">
              <button
                type="button"
                onClick={() => performB2BSearch(query || 'products')}
                className="px-3 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                B2B/Bulk
              </button>
              <button
                type="button"
                onClick={() => performLocalSearch(query || 'products')}
                className="px-3 py-2 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                Local Products
              </button>
              <button
                type="button"
                onClick={() => performUrgentSearch(query || 'products')}
                className="px-3 py-2 rounded-full bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
              >
                Fast Delivery
              </button>
            </div>

            {/* Intent Explanation */}
            {lastIntent && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-primary-500 rounded-full"></span>
                {intentExplanation}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {results.length > 0 ? (
          <VoiceSearchResults
            results={results}
            query={query}
            intent={lastIntent}
            isLoading={isSearching}
            error={error ? error.message : null}
            totalResults={totalResults}
            currentPage={currentPage}
            totalPages={totalPages}
            onProductClick={handleProductClick}
            onAddToCart={handleAddToCart}
            onPageChange={goToPage}
            showPersonalizationInsights={true}
          />
        ) : results.length === 0 && query && !isSearching ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No results. Try a different search query.</p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Try searching for products using voice or text</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceSearchExample;
