/**
 * Voice Search Hook
 * Custom React hook for integrating agentic voice search
 * Manages voice input, intent parsing, and result ranking
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  VoiceSearchResponse,
  VoiceSearchProduct,
  SearchIntent,
  VoiceSearchError,
  UserInteraction,
} from '../types/voiceSearch';
import * as voiceSearchApi from '../api/voiceSearchApi';
import * as intentParser from '../services/intentParserService';
import * as recommendationEngine from '../services/recommendationEngineService';

export interface UseVoiceSearchOptions {
  /** Enable automatic speech-to-text via Web Speech API */
  enableSpeechRecognition?: boolean;

  /** Automatically trigger search on final transcript */
  autoSearch?: boolean;

  /** Language code for speech recognition (default: 'en-US') */
  language?: string;

  /** Callback when search completes */
  onSearchComplete?: (results: VoiceSearchResponse) => void;

  /** Callback on error */
  onError?: (error: VoiceSearchError | Error) => void;

  /** User ID for personalization */
  userId?: number;

  /** Pre-fetched user interaction history */
  userInteractions?: UserInteraction[] | null;
}

export interface UseVoiceSearchResult {
  // State
  query: string;
  isListening: boolean;
  isSearching: boolean;
  results: VoiceSearchProduct[];
  error: VoiceSearchError | Error | null;
  lastIntent: SearchIntent | null;
  totalResults: number;
  currentPage: number;
  totalPages: number;

  // Actions
  setQuery: (query: string) => void;
  startListening: () => void;
  stopListening: () => void;
  performSearch: (query?: string) => Promise<VoiceSearchResponse | null>;
  performB2BSearch: (query?: string) => Promise<VoiceSearchResponse | null>;
  performLocalSearch: (query?: string) => Promise<VoiceSearchResponse | null>;
  performUrgentSearch: (query?: string) => Promise<VoiceSearchResponse | null>;
  clearResults: () => void;
  goToPage: (page: number) => Promise<VoiceSearchResponse | null>;

  // Metadata
  intentExplanation: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Custom hook for voice-enabled agentic search
 * Integrates speech recognition, intent parsing, and personalization
 * 
 * @param options - Configuration options
 * @returns Voice search state and actions
 * 
 * @example
 * const {
 *   query,
 *   isListening,
 *   results,
 *   performSearch,
 *   startListening,
 *   // ... other methods
 * } = useVoiceSearch({
 *   enableSpeechRecognition: true,
 *   autoSearch: true,
 *   userId: 123
 * });
 */
export const useVoiceSearch = (options: UseVoiceSearchOptions = {}): UseVoiceSearchResult => {
  const {
    enableSpeechRecognition = true,
    autoSearch = true,
    language = 'en-US',
    onSearchComplete,
    onError,
    userId,
    userInteractions = null,
  } = options;

  // State
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<VoiceSearchProduct[]>([]);
  const [error, setError] = useState<VoiceSearchError | Error | null>(null);
  const [lastIntent, setLastIntent] = useState<SearchIntent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // References
  const recognitionRef = useRef<any>(null);
  const interimTranscriptRef = useRef('');

  // Initialize speech recognition
  useEffect(() => {
    if (!enableSpeechRecognition) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const err = new Error('Speech recognition not supported in this browser');
      setError(err);
      onError?.(err);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.language = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      interimTranscriptRef.current = interimTranscript;

      if (finalTranscript) {
        const cleanedTranscript = finalTranscript.trim();
        setQuery(cleanedTranscript);

        if (autoSearch) {
          performSearch(cleanedTranscript);
        }
      } else {
        setQuery(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      const err = new Error(`Speech recognition error: ${event.error}`);
      setError(err);
      onError?.(err);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [enableSpeechRecognition, language, autoSearch, onError]);

  /**
   * Starts listening for voice input
   */
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      const err = new Error('Speech recognition not available');
      setError(err);
      onError?.(err);
      return;
    }

    setQuery('');
    interimTranscriptRef.current = '';
    setError(null);
    recognitionRef.current.start();
  }, [onError]);

  /**
   * Stops listening for voice input
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  /**
   * Performs a voice search with given query
   * Parses intent, filters results, applies personalization
   */
  const performSearch = useCallback(
    async (searchQuery?: string): Promise<VoiceSearchResponse | null> => {
      const queryToSearch = searchQuery || query;

      if (!queryToSearch.trim()) {
        const err = new Error('Search query cannot be empty');
        setError(err);
        onError?.(err);
        return null;
      }

      setIsSearching(true);
      setError(null);

      try {
        // Validate request
        voiceSearchApi.validateVoiceSearchRequest({
          query: queryToSearch,
          page: currentPage,
          page_size: 20,
        });

        // Perform API search
        const response = await voiceSearchApi.voiceSearchByText(queryToSearch, currentPage, 20);

        // Update intent
        setLastIntent(response.intent);

        // Apply personalization ranking if user is authenticated
        let rankedResults = response.results;
        if (userId && userInteractions) {
          rankedResults = await recommendationEngine.rankProducts(
            response.results,
            response.intent,
            userInteractions,
            userId
          );
        }

        // Update results
        setResults(rankedResults);
        setTotalResults(response.metadata.total_results);
        setCurrentPage(response.metadata.page);
        setTotalPages(response.metadata.total_pages);

        onSearchComplete?.(response);

        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Search failed');
        setError(error);
        setResults([]);
        onError?.(error);
        return null;
      } finally {
        setIsSearching(false);
      }
    },
    [query, currentPage, userId, userInteractions, onSearchComplete, onError]
  );

  /**
   * Performs a B2B-focused search
   */
  const performB2BSearch = useCallback(
    async (searchQuery?: string): Promise<VoiceSearchResponse | null> => {
      const queryToSearch = searchQuery || query;
      return performSearch(`bulk ${queryToSearch}`);
    },
    [performSearch, query]
  );

  /**
   * Performs a local/Nepal-made product search
   */
  const performLocalSearch = useCallback(
    async (searchQuery?: string): Promise<VoiceSearchResponse | null> => {
      const queryToSearch = searchQuery || query;
      return performSearch(`local ${queryToSearch}`);
    },
    [performSearch, query]
  );

  /**
   * Performs an urgent/fast-delivery search
   */
  const performUrgentSearch = useCallback(
    async (searchQuery?: string): Promise<VoiceSearchResponse | null> => {
      const queryToSearch = searchQuery || query;
      return performSearch(`urgent ${queryToSearch} today`);
    },
    [performSearch, query]
  );

  /**
   * Clears search results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setQuery('');
    setLastIntent(null);
    setCurrentPage(1);
    setTotalResults(0);
    setTotalPages(0);
    setError(null);
  }, []);

  /**
   * Navigate to specific page of results
   */
  const goToPage = useCallback(
    async (page: number): Promise<VoiceSearchResponse | null> => {
      if (page < 1 || page > totalPages) {
        return null;
      }

      setCurrentPage(page);
      return performSearch(query);
    },
    [query, totalPages, performSearch]
  );

  // Generate intent explanation
  const intentExplanation =
    lastIntent ? intentParser.explainIntent(lastIntent) : 'Standard search';

  return {
    // State
    query,
    isListening,
    isSearching,
    results,
    error,
    lastIntent,
    totalResults,
    currentPage,
    totalPages,

    // Actions
    setQuery,
    startListening,
    stopListening,
    performSearch,
    performB2BSearch,
    performLocalSearch,
    performUrgentSearch,
    clearResults,
    goToPage,

    // Metadata
    intentExplanation,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
};

export default useVoiceSearch;
