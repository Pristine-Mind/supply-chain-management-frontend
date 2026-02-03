import React, { useEffect, useState, useRef } from 'react';
import { ChevronRight, TrendingUp, Search, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Suggestion {
  query: string;
  type: 'product' | 'trending' | 'history';
  reason?: string;
  confidence?: number;
  productId?: number | string;
  id?: number | string;
  timestamp?: number;
  source?: 'search' | 'suggestions';
}

interface Props {
  query: string;
  minLength?: number;
  onSelect?: (value: string) => void;
  maxResults?: number;
  debounceDelay?: number;
  isFocused?: boolean;
}

const SearchSuggestions: React.FC<Props> = ({ 
  query, 
  minLength = 2, 
  onSelect, 
  maxResults = 10, 
  debounceDelay = 250,
  isFocused = false
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<Suggestion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cacheRef = useRef<Map<string, Suggestion[]>>(new Map());
  const lastResultsRef = useRef<Suggestion[] | null>(null);
  const lastQueryRef = useRef<string>('');

  const SEARCH_HISTORY_KEY = 'mulyaBazzar_searchHistory';
  const MAX_HISTORY_ITEMS = 10;

  // Load search history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (saved) {
      try {
        const history = JSON.parse(saved) as Suggestion[];
        setSearchHistory(history.slice(0, MAX_HISTORY_ITEMS));
      } catch (e) {
        console.error('Failed to load search history:', e);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (history: Suggestion[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  };

  // Add to search history
  const addToHistory = (query: string) => {
    const newItem: Suggestion = {
      query,
      type: 'history',
      timestamp: Date.now()
    };

    const updated = [
      newItem,
      ...searchHistory.filter(h => h.query.toLowerCase() !== query.toLowerCase())
    ].slice(0, MAX_HISTORY_ITEMS);

    setSearchHistory(updated);
    saveSearchHistory(updated);
  };

  // Remove from history
  const removeFromHistory = (e: React.MouseEvent, queryToRemove: string) => {
    e.stopPropagation();
    const updated = searchHistory.filter(h => h.query !== queryToRemove);
    setSearchHistory(updated);
    saveSearchHistory(updated);
  };

  // Clear all history
  const clearAllHistory = () => {
    setSearchHistory([]);
    saveSearchHistory([]);
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!query || query.length < minLength) {
      setSuggestions([]);
      if (isFocused && query.length === 0) {
        setOpen(true);
        setShowHistory(true);
      } else {
        setOpen(false);
      }
      lastQueryRef.current = '';
      lastResultsRef.current = null;
      return;
    }

    setShowHistory(false);
    setOpen(true);

    const cached = cacheRef.current.get(query);
    if (cached) {
      setSuggestions(cached);
      setLoading(false);
      lastResultsRef.current = cached;
      lastQueryRef.current = query;
      return;
    }

    if (lastQueryRef.current && query.startsWith(lastQueryRef.current) && lastResultsRef.current) {
      const local = lastResultsRef.current
        .filter((s) => s.query.toLowerCase().includes(query.toLowerCase()))
        .slice(0, maxResults);
      if (local.length > 0) {
        setSuggestions(local);
      }
    }

    setLoading(true);

    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    const timer = setTimeout(async () => {
      try {
        const apiUrl = import.meta.env.VITE_REACT_APP_API_URL || '';
        
        const [productResponse, trendingResponse] = await Promise.allSettled([
          fetch(
            `${apiUrl}/api/v1/marketplace/search/?keyword=${encodeURIComponent(query)}&limit=${Math.ceil(maxResults / 2)}`,
            { signal }
          ),
          fetch(
            `${apiUrl}/api/v1/suggestions/?query=${encodeURIComponent(query)}&limit=${Math.ceil(maxResults / 2)}`,
            { signal }
          )
        ]);

        const combinedSuggestions: Suggestion[] = [];

        if (productResponse.status === 'fulfilled' && productResponse.value.ok) {
          const data = await productResponse.value.json();
          const results = Array.isArray(data.results) ? data.results : [];
            const productNames = results
              .map((r: any) => ({
                name: r.product_details?.name || r.name || r.title || '',
                id: r.id || r.product_details?.id,
                productId: r.product || r.product_id
              }))
              .filter((p: any) => p.name && p.name.toLowerCase().includes(query.toLowerCase()))
              .map((p: any) => ({
                query: p.name,
                type: 'product' as const,
                id: p.id,
                productId: p.productId,
                source: 'search' as const
              }));
          combinedSuggestions.push(...productNames);
        }

        if (trendingResponse.status === 'fulfilled' && trendingResponse.value.ok) {
          const data = await trendingResponse.value.json();
          const trendingSuggestions = data.suggestions || [];
          const trending = trendingSuggestions.map((s: any) => ({
            query: s.query,
            type: 'trending' as const,
            reason: s.reason,
            confidence: s.confidence,
            productId: s.product_id || s.productId || s.product || null,
            source: 'suggestions' as const
          }));
          combinedSuggestions.push(...trending);
        }

        const uniqueSuggestions = Array.from(
          new Map(combinedSuggestions.map(s => [s.query.toLowerCase(), s])).values()
        ).slice(0, maxResults);

        setSuggestions(uniqueSuggestions);

        try {
          cacheRef.current.set(query, uniqueSuggestions);
          lastResultsRef.current = uniqueSuggestions;
          lastQueryRef.current = query;

          if (cacheRef.current.size > 200) {
            const firstKey = cacheRef.current.keys().next().value;
            if (typeof firstKey === 'string') {
              cacheRef.current.delete(firstKey);
            }
          }
        } catch (e) {
          // Ignore cache errors
        }
      } catch (err) {
        if ((err as any)?.name === 'AbortError') {
          // Ignored
        } else {
          console.error('Suggestion fetch failed', err);
        }
      } finally {
        setLoading(false);
      }
    }, debounceDelay);

    return () => {
      clearTimeout(timer);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [query, minLength, maxResults, debounceDelay]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        onSelect && onSelect(suggestions[activeIndex].query);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const navigate = useNavigate();

  const handleSelect = (suggestion: Suggestion) => {
    setOpen(false);
    
    // Add to history for all types except trending
    if (suggestion.type !== 'trending') {
      addToHistory(suggestion.query);
    }
    
    // Navigate based on source - search API uses id, suggestions API uses productId
    if (suggestion.source === 'search' && suggestion.id) {
      navigate(`/marketplace/${suggestion.id}`);
      return;
    }
    
    if (suggestion.source === 'suggestions' && suggestion.productId) {
      navigate(`/marketplace/${suggestion.productId}`);
      return;
    }
    
    if (onSelect) {
      onSelect(suggestion.query);
    }
  };

  if (!open) return null;

  // Show history if no query or query is too short and history is not empty
  const displayHistory = showHistory && searchHistory.length > 0;
  const itemsToDisplay = displayHistory ? searchHistory : suggestions;

  return (
    <div ref={containerRef} className="absolute z-50 mt-2 w-full max-w-4xl left-1/2 -translate-x-1/2">
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm bg-opacity-95">
        {loading && (
          <div className="p-4 flex items-center gap-3 text-neutral-600">
            <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Finding suggestions...</span>
          </div>
        )}

        {!loading && !displayHistory && suggestions.length === 0 && (
          <div className="p-4 text-center">
            <Search className="w-5 h-5 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No suggestions found</p>
          </div>
        )}

        {(displayHistory || (!loading && suggestions.length > 0)) && (
          <>
            <ul className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
              {itemsToDisplay.map((s, idx) => (
                <li key={`${s.type}-${s.query}-${idx}`}>
                  <button
                    onClick={() => handleSelect(s)}
                    onKeyDown={handleKeyDown}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors duration-150 group border-b border-neutral-100 last:border-b-0 ${
                      idx === activeIndex 
                        ? 'bg-neutral-100' 
                        : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-neutral-900">
                        <span className="font-semibold">{s.query.split(' ')[0]}</span>
                        {s.query.split(' ').length > 1 && (
                          <span className="font-normal"> {s.query.split(' ').slice(1).join(' ')}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {s.type === 'history' ? (
                        <button
                          onClick={(e) => removeFromHistory(e, s.query)}
                          className="p-1 hover:bg-red-100 rounded-md transition-colors text-neutral-300 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <ChevronRight className={`w-4 h-4 transition-all duration-150 ${
                          idx === activeIndex ? 'text-orange-500 translate-x-1' : 'text-neutral-300 group-hover:text-neutral-400'
                        }`} />
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchSuggestions;
