import React, { useEffect, useState, useRef } from 'react';
import { ChevronRight, TrendingUp, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Suggestion {
  query: string;
  type: 'product' | 'trending';
  reason?: string;
  confidence?: number;
  productId?: number | string;
}

interface Props {
  query: string;
  minLength?: number;
  onSelect?: (value: string) => void;
  maxResults?: number;
  debounceDelay?: number;
}

const SearchSuggestions: React.FC<Props> = ({ 
  query, 
  minLength = 2, 
  onSelect, 
  maxResults = 10, 
  debounceDelay = 250 
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const controllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cacheRef = useRef<Map<string, Suggestion[]>>(new Map());
  const lastResultsRef = useRef<Suggestion[] | null>(null);
  const lastQueryRef = useRef<string>('');

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
      setOpen(false);
      lastQueryRef.current = '';
      lastResultsRef.current = null;
      return;
    }

    setOpen(true);
    setActiveIndex(-1);

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
                productId: r.product || r.product_details?.id || r.id || r.product_id || null
              }))
              .filter((p: any) => p.name && p.name.toLowerCase().includes(query.toLowerCase()))
              .map((p: any) => ({
                query: p.name,
                type: 'product' as const,
                productId: p.productId
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
            productId: s.product_id || s.productId || s.product || null
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
    if (suggestion.productId) {
      navigate(`/marketplace/${suggestion.productId}`);
      return;
    }
    if (onSelect) {
      onSelect(suggestion.query);
    }
  };

  if (!open) return null;

  return (
    <div ref={containerRef} className="absolute z-50 mt-1 w-full max-w-xl">
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
        {loading && (
          <div className="p-3 text-sm text-neutral-500">Loading suggestions...</div>
        )}

        {!loading && suggestions.length === 0 && (
          <div className="p-3 text-sm text-neutral-500">No suggestions</div>
        )}

        {!loading && suggestions.length > 0 && (
          <ul className="max-h-64 overflow-auto">
            {suggestions.map((s, idx) => (
              <li key={`${s.type}-${s.query}-${idx}`}>
                <button
                  onClick={() => handleSelect(s)}
                  onKeyDown={handleKeyDown}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-neutral-50 focus:bg-neutral-50 transition-colors ${
                    idx === activeIndex ? 'bg-neutral-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {s.type === 'trending' ? (
                      <TrendingUp className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    ) : (
                      <Search className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    )}
                    <span className="text-sm text-neutral-900 truncate">{s.query}</span>
                    {s.type === 'trending' && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        Trending
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0 ml-2" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchSuggestions;
