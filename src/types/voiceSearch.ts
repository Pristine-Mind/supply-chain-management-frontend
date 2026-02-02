export interface SearchIntent {
  query: string;
  min_price?: number;
  max_price?: number;
  
  is_b2b: boolean;
  
  made_in_nepal: boolean;
  
  color?: string;
  
  size?: string;
  
  urgency: 'normal' | 'high' | 'very_high';
  
  sort_by: 'price_asc' | 'price_desc' | 'delivery_speed' | 'relevance';
}

export interface PaginationMetadata {
  total_results: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  page_size: number;
}

export interface VoiceSearchProduct {
  id: number;
  name: string;
  
  /** B2B pricing for bulk/wholesale orders */
  b2b_price?: number;
  
  /** Regular consumer price */
  listed_price: number;
  
  /** Discount applied to listed price */
  discounted_price?: number;
  
  /** Product attributes extracted from intent */
  color?: string;
  size?: string;
  
  /** Nepal origin badge */
  is_made_in_nepal: boolean;
  
  /** Estimated delivery timeframe */
  estimated_delivery_days?: number;
  
  /** Product description */
  description?: string;
  
  /** Product category */
  category?: string;
  
  /** Product images */
  images?: string[];
  
  /** Brand name */
  brand?: string;
  
  /** Product rating */
  rating?: number;
  
  /** Number of reviews */
  review_count?: number;
  
  /** Availability status */
  is_available: boolean;
  
  /** Featured/highlighted product */
  is_featured?: boolean;
}

export interface VoiceSearchResponse {
  /** Original query text (voice transcript or text input) */
  query: string;
  
  /** Extracted intent from query */
  intent: SearchIntent;
  
  /** Response metadata for pagination */
  metadata: PaginationMetadata;
  
  /** Array of product results */
  results: VoiceSearchProduct[];
}

export interface UserInteraction {
  user_id: number;
  
  /** Product ID interacted with */
  product_id: number;
  
  /** Category ID of product */
  category_id: number;
  
  /** Brand ID of product */
  brand_id?: number;
  
  /** Type of interaction */
  interaction_type: 'view' | 'click' | 'purchase' | 'add_to_cart';
  
  /** Timestamp of interaction */
  timestamp: string;
}

export interface RecommendationBoost {
  product_id: number;
  
  /** Boost score from 0 to 1 */
  boost_score: number;
  
  /** Reason for boost */
  reason: 'category_match' | 'brand_match' | 'purchase_history' | 'recent_view';
}


export interface VoiceSearchRequest {
  /** Text query (required if audio_file not provided) */
  query?: string;
  
  /** Audio file for speech-to-text conversion (optional) */
  audio_file?: File;
  
  /** Page number for pagination (default: 1) */
  page?: number;
  
  /** Results per page (default: 20) */
  page_size?: number;
  
  /** User ID for personalized results (optional) */
  user_id?: number;
}

export interface VoiceSearchError {
  error: string;
  code: 'MISSING_QUERY' | 'INVALID_AUDIO' | 'SPEECH_SERVICE_ERROR' | 'SERVER_ERROR';
  status_code: number;
  timestamp: string;
}


export interface IntentParsingResult {
  /** Parsed core query */
  query: string;
  
  /** Detected price constraints */
  priceConstraints?: {
    min?: number;
    max?: number;
  };
  
  /** Whether B2B context detected */
  isB2B: boolean;
  
  /** Whether local/Nepal-made preference detected */
  isLocalPreferred: boolean;
  
  /** Extracted attributes */
  attributes?: {
    color?: string;
    size?: string;
  };
  
  /** Detected urgency level */
  urgency: 'normal' | 'high' | 'very_high';
  
  /** Suggested sorting */
  suggestedSort: 'price_asc' | 'price_desc' | 'delivery_speed' | 'relevance';
  
  /** Confidence score of parsing (0-1) */
  confidence: number;
}


export interface VoiceSearchStats {
  total_searches: number;
  avg_response_time_ms: number;
  successful_conversions: number;
  conversion_rate: number;
  top_queries: string[];
  most_detected_intents: string[];
}
