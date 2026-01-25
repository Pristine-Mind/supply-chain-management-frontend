/**
 * Agentic Voice Search API Module
 * Handles communication with the voice search endpoint
 * Supports both audio and text input with LLM-style intent parsing
 */

import axios, { AxiosError } from 'axios';
import {
  VoiceSearchRequest,
  VoiceSearchResponse,
  VoiceSearchError,
} from '../types/voiceSearch';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000';
const VOICE_SEARCH_ENDPOINT = `/api/v1/marketplace/voice-search/`;

/**
 * Performs a voice/agentic search with intent parsing
 * Accepts either text query or audio file for processing
 * 
 * @param request - Voice search request with query or audio
 * @returns Voice search response with intent and results
 * @throws VoiceSearchError if request fails
 * 
 * @example
 * // Text-based search
 * const results = await performVoiceSearch({
 *   query: "wholesale red bricks under 500",
 *   page: 1,
 *   page_size: 20
 * });
 * 
 * // Audio-based search
 * const audioFile = await getAudioFile();
 * const results = await performVoiceSearch({
 *   audio_file: audioFile,
 *   page: 1
 * });
 */
export const performVoiceSearch = async (
  request: VoiceSearchRequest
): Promise<VoiceSearchResponse> => {
  try {
    // Validate that at least query or audio_file is provided
    if (!request.query && !request.audio_file) {
      throw new Error('Either query or audio_file must be provided');
    }

    // Build form data for multipart/form-data if audio is present
    const formData = new FormData();
    
    if (request.query) {
      formData.append('query', request.query);
    }
    
    if (request.audio_file) {
      formData.append('audio_file', request.audio_file);
    }
    
    if (request.page) {
      formData.append('page', request.page.toString());
    }
    
    if (request.page_size) {
      formData.append('page_size', request.page_size.toString());
    }

    if (request.user_id) {
      formData.append('user_id', request.user_id.toString());
    }

    // Get auth token for personalized results
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    const response = await axios.post<VoiceSearchResponse>(
      `${API_BASE_URL}${VOICE_SEARCH_ENDPOINT}`,
      formData,
      {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30s timeout for audio processing
      }
    );

    return response.data;
  } catch (error) {
    handleVoiceSearchError(error);
    throw error;
  }
};

/**
 * Performs a text-only voice search (simplified wrapper)
 * 
 * @param query - Text query (as if from speech recognition)
 * @param page - Page number (default: 1)
 * @param pageSize - Results per page (default: 20)
 * @returns Voice search response with extracted intent and results
 * 
 * @example
 * const results = await voiceSearchByText("bulk office chairs under $500");
 */
export const voiceSearchByText = async (
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<VoiceSearchResponse> => {
  return performVoiceSearch({
    query,
    page,
    page_size: pageSize,
  });
};

/**
 * Performs a voice search using an audio file
 * Useful for backend speech-to-text processing
 * 
 * @param audioFile - Audio file (WAV, MP3, etc.)
 * @param page - Page number
 * @param pageSize - Results per page
 * @returns Voice search response with speech-to-text and intent extraction
 * 
 * @example
 * const audioFile = await recordAudio();
 * const results = await voiceSearchByAudio(audioFile);
 */
export const voiceSearchByAudio = async (
  audioFile: File,
  page: number = 1,
  pageSize: number = 20
): Promise<VoiceSearchResponse> => {
  return performVoiceSearch({
    audio_file: audioFile,
    page,
    page_size: pageSize,
  });
};

/**
 * Performs personalized voice search for authenticated user
 * Boosts results based on user's interaction history
 * 
 * @param query - Text query from voice or input
 * @param userId - User ID for personalization
 * @param page - Page number
 * @param pageSize - Results per page
 * @returns Hyper-personalized voice search response
 * 
 * @example
 * const userId = parseInt(localStorage.getItem('user_id') || '0');
 * const results = await personalizedVoiceSearch(
 *   "red office chairs",
 *   userId,
 *   1,
 *   20
 * );
 */
export const personalizedVoiceSearch = async (
  query: string,
  userId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<VoiceSearchResponse> => {
  return performVoiceSearch({
    query,
    user_id: userId,
    page,
    page_size: pageSize,
  });
};

/**
 * Suggests B2B-focused search with intent for bulk purchases
 * 
 * @param query - Base query for bulk/wholesale
 * @param page - Page number
 * @param pageSize - Results per page
 * @returns Voice search response with B2B intent prioritization
 * 
 * @example
 * const results = await b2bVoiceSearch("industrial paper under $1000");
 */
export const b2bVoiceSearch = async (
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<VoiceSearchResponse> => {
  // B2B intent is auto-detected via keywords (bulk, wholesale, etc.)
  // but this function ensures it's treated as B2B search
  return voiceSearchByText(`bulk ${query}`, page, pageSize);
};

/**
 * Suggests location-aware search for local/Nepal-made products
 * 
 * @param query - Base query
 * @param page - Page number
 * @param pageSize - Results per page
 * @returns Voice search response with local product boost
 * 
 * @example
 * const results = await localVoiceSearch("handicrafts");
 */
export const localVoiceSearch = async (
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<VoiceSearchResponse> => {
  // Add "local" or "swadeshi" keyword to trigger geographic boost
  return voiceSearchByText(`local ${query}`, page, pageSize);
};

/**
 * Suggests urgent delivery-focused search
 * Prioritizes fast/express delivery options
 * 
 * @param query - Base query
 * @param page - Page number
 * @param pageSize - Results per page
 * @returns Voice search response sorted by delivery speed
 * 
 * @example
 * const results = await urgentVoiceSearch("laptop stand", 1, 10);
 */
export const urgentVoiceSearch = async (
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<VoiceSearchResponse> => {
  // Add "urgent" or "today" keyword to trigger urgency sorting
  return voiceSearchByText(`urgent ${query} today`, page, pageSize);
};

/**
 * Handles and normalizes voice search errors
 * Converts API errors to user-friendly messages
 * 
 * @param error - Original error from axios or validation
 * @throws Normalized VoiceSearchError
 */
function handleVoiceSearchError(error: unknown): never {
  if (error instanceof Error && error.message === 'Either query or audio_file must be provided') {
    const voiceError: VoiceSearchError = {
      error: 'Please provide either a text query or audio file',
      code: 'MISSING_QUERY',
      status_code: 400,
      timestamp: new Date().toISOString(),
    };
    throw voiceError;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    // Handle 400 Bad Request
    if (axiosError.response?.status === 400) {
      const voiceError: VoiceSearchError = {
        error: 'Invalid query or audio file format',
        code: 'INVALID_AUDIO',
        status_code: 400,
        timestamp: new Date().toISOString(),
      };
      throw voiceError;
    }

    // Handle 503 Service Unavailable
    if (axiosError.response?.status === 503) {
      const voiceError: VoiceSearchError = {
        error: 'Speech recognition service is temporarily unavailable',
        code: 'SPEECH_SERVICE_ERROR',
        status_code: 503,
        timestamp: new Date().toISOString(),
      };
      throw voiceError;
    }

    // Handle timeout
    if (axiosError.code === 'ECONNABORTED') {
      const voiceError: VoiceSearchError = {
        error: 'Request timeout. Please try again with a shorter query.',
        code: 'SERVER_ERROR',
        status_code: 504,
        timestamp: new Date().toISOString(),
      };
      throw voiceError;
    }

    // Handle network error
    if (!axiosError.response) {
      const voiceError: VoiceSearchError = {
        error: 'Network error. Please check your connection.',
        code: 'SERVER_ERROR',
        status_code: 0,
        timestamp: new Date().toISOString(),
      };
      throw voiceError;
    }
  }

  // Generic server error
  const voiceError: VoiceSearchError = {
    error: 'An unexpected error occurred during voice search',
    code: 'SERVER_ERROR',
    status_code: 500,
    timestamp: new Date().toISOString(),
  };
  throw voiceError;
}

/**
 * Validates voice search request before sending
 * 
 * @param request - Request to validate
 * @returns true if valid, throws error otherwise
 */
export const validateVoiceSearchRequest = (request: VoiceSearchRequest): boolean => {
  if (!request.query && !request.audio_file) {
    throw new Error('Either query or audio_file must be provided');
  }

  if (request.query && request.query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  if (request.audio_file) {
    const validMimes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm'];
    if (!validMimes.includes(request.audio_file.type)) {
      throw new Error(`Invalid audio format. Supported: ${validMimes.join(', ')}`);
    }
  }

  if (request.page_size && (request.page_size < 1 || request.page_size > 100)) {
    throw new Error('page_size must be between 1 and 100');
  }

  return true;
};

export default {
  performVoiceSearch,
  voiceSearchByText,
  voiceSearchByAudio,
  personalizedVoiceSearch,
  b2bVoiceSearch,
  localVoiceSearch,
  urgentVoiceSearch,
  validateVoiceSearchRequest,
};
