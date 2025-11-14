import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ChevronRight } from 'lucide-react';

interface Props {
  query: string;
  minLength?: number;
  onSelect?: (value: string) => void;
  maxResults?: number;
  debounceDelay?: number;
}

const SearchSuggestions: React.FC<Props> = ({ query, minLength = 2, onSelect, maxResults = 10, debounceDelay }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const controllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cacheRef = useRef<Map<string, string[]>>(new Map());
  const lastResultsRef = useRef<string[] | null>(null);
  const lastQueryRef = useRef<string>('');

  useEffect(() => {
    // close on outside click
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

    // If we have exact cached results, use them immediately
    const cached = cacheRef.current.get(query);
    if (cached) {
      setSuggestions(cached);
      setLoading(false);
      lastResultsRef.current = cached;
      lastQueryRef.current = query;
      return;
    }

    // If query extends lastQuery, try to filter lastResults locally for instant feedback
    if (lastQueryRef.current && query.startsWith(lastQueryRef.current) && lastResultsRef.current) {
      const local = lastResultsRef.current.filter((n) => n.toLowerCase().includes(query.toLowerCase())).slice(0, maxResults);
      if (local.length > 0) {
        setSuggestions(local);
        // continue to fetch in background to refresh results
      }
    }

    setLoading(true);

    // cancel previous
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    const timer = setTimeout(async () => {
      try {
        const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/search/?keyword=${encodeURIComponent(
          query
        )}&limit=${maxResults}`;
        const { data } = await axios.get(url, { signal });
        const results = Array.isArray(data.results) ? data.results : [];
        const names = results
          .map((r: any) => r.product_details?.name || r.name || r.title || '')
          .filter((n: string) => n && n.toLowerCase().includes(query.toLowerCase()));
        const uniq = Array.from(new Set(names)).slice(0, maxResults) as string[];
        setSuggestions(uniq);
        // cache exact query
        try {
          cacheRef.current.set(query, uniq);
          // keep last results for prefix filtering
          lastResultsRef.current = uniq;
          lastQueryRef.current = query;
          // keep cache size in check (simple LRU-like by trimming oldest if too many)
          if (cacheRef.current.size > 200) {
            const firstKey = cacheRef.current.keys().next().value;
            if (typeof firstKey === 'string') {
              cacheRef.current.delete(firstKey);
            }
          }
        } catch (e) {
          // ignore cache set errors
        }
      } catch (err) {
        if ((err as any)?.name === 'CanceledError' || (err as any)?.name === 'AbortError') {
          // ignored
        } else {
          console.error('Suggestion fetch failed', err);
        }
      } finally {
        setLoading(false);
      }
    }, typeof debounceDelay === 'number' ? debounceDelay : 250);

    return () => {
      clearTimeout(timer);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [query, minLength, maxResults]);

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
        onSelect && onSelect(suggestions[activeIndex]);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
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
              <li key={s}>
                <button
                  onClick={() => (onSelect ? onSelect(s) : undefined)}
                  onKeyDown={handleKeyDown}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-neutral-50 focus:bg-neutral-50 ${
                    idx === activeIndex ? 'bg-neutral-100' : ''
                  }`}
                >
                  <span className="text-sm text-neutral-900">{s}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
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
