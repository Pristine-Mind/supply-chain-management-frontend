/**
 * Intent Parser Service
 * LLM-style natural language parsing to extract search intent
 * Handles price brackets, B2B logic, geographic preferences, urgency, and attributes
 */

import {
  IntentParsingResult,
  SearchIntent,
} from '../types/voiceSearch';

/**
 * Color keywords mapping for intent extraction
 */
const COLOR_KEYWORDS: Record<string, string> = {
  red: 'RED',
  orange: 'ORANGE',
  yellow: 'YELLOW',
  green: 'GREEN',
  blue: 'BLUE',
  purple: 'PURPLE',
  pink: 'PINK',
  black: 'BLACK',
  white: 'WHITE',
  gray: 'GRAY',
  grey: 'GRAY',
  brown: 'BROWN',
  navy: 'NAVY',
  teal: 'TEAL',
  beige: 'BEIGE',
  cream: 'CREAM',
  silver: 'SILVER',
  gold: 'GOLD',
  copper: 'COPPER',
};

/**
 * Size keywords and units
 */
const SIZE_KEYWORDS = ['small', 's', 'medium', 'm', 'large', 'l', 'xl', 'xxl', 'xs', 'one size'];

/**
 * B2B trigger keywords
 */
const B2B_KEYWORDS = [
  'wholesale',
  'bulk',
  'business',
  'b2b',
  'industrial',
  'commercial',
  'distributor',
  'reseller',
  'merchant',
  'corporate',
  'bulk order',
];

/**
 * Local/Nepal-made trigger keywords
 */
const LOCAL_KEYWORDS = [
  'local',
  'swadeshi',
  'nepal made',
  'made in nepal',
  'local brand',
  'nepal',
  'domestic',
  'handmade',
];

/**
 * Urgency trigger keywords
 */
const URGENCY_KEYWORDS = {
  high: ['urgent', 'asap', 'today', 'now', 'immediately'],
  very_high: ['critical', 'emergency', 'same day', 'express'],
};

/**
 * Price constraint patterns
 */
const PRICE_PATTERNS = {
  under: /under\s+(?:rs\.?\s*|$)?(\d+)/gi,
  above: /above\s+(?:rs\.?\s*|$)?(\d+)/gi,
  between: /between\s+(?:rs\.?\s*|$)?(\d+)\s+(?:and|to|–|-)\s+(?:rs\.?\s*|$)?(\d+)/gi,
  range: /(\d+)\s*-\s*(\d+)/g,
};

/**
 * Parses natural language query to extract search intent
 * Non-deterministic approach for human-centric parsing
 * 
 * @param query - Natural language search query
 * @returns Parsed intent with confidence score
 * 
 * @example
 * const intent = parseSearchIntent("wholesale red bricks under 500");
 * // Returns:
 * // {
 * //   query: "bricks",
 * //   priceConstraints: { max: 500 },
 * //   isB2B: true,
 * //   isLocalPreferred: false,
 * //   attributes: { color: "RED" },
 * //   urgency: "normal",
 * //   suggestedSort: "price_asc",
 * //   confidence: 0.92
 * // }
 */
export const parseSearchIntent = (query: string): IntentParsingResult => {
  const lowerQuery = query.toLowerCase().trim();
  let confidence = 0.5; // Base confidence
  const result: IntentParsingResult = {
    query: lowerQuery,
    isB2B: false,
    isLocalPreferred: false,
    urgency: 'normal',
    suggestedSort: 'relevance',
  };

  // Extract core query by removing intent keywords
  let coreQuery = lowerQuery;
  coreQuery = removeKeywords(coreQuery, B2B_KEYWORDS, () => {
    result.isB2B = true;
    confidence += 0.1;
  });

  coreQuery = removeKeywords(coreQuery, LOCAL_KEYWORDS, () => {
    result.isLocalPreferred = true;
    confidence += 0.1;
  });

  coreQuery = extractUrgency(coreQuery, result, () => {
    confidence += 0.05;
  });

  result.query = cleanQuery(coreQuery);

  // Extract price constraints
  const priceResult = extractPriceConstraints(lowerQuery);
  if (priceResult) {
    result.priceConstraints = priceResult;
    confidence += 0.15;
  }

  // Extract attributes (color, size)
  result.attributes = extractAttributes(lowerQuery);
  if (result.attributes?.color || result.attributes?.size) {
    confidence += 0.1;
  }

  // Determine sorting based on detected intent
  if (result.priceConstraints?.max) {
    result.suggestedSort = 'price_asc';
  } else if (result.urgency !== 'normal') {
    result.suggestedSort = 'delivery_speed';
  }

  // Ensure confidence stays within 0-1
  result.confidence = Math.min(1, confidence);

  return result;
};

/**
 * Converts parsed intent to SearchIntent for API
 * 
 * @param parsed - Parsed intent result
 * @returns SearchIntent object for API request
 */
export const toSearchIntent = (parsed: IntentParsingResult): SearchIntent => {
  return {
    query: parsed.query,
    min_price: parsed.priceConstraints?.min,
    max_price: parsed.priceConstraints?.max,
    is_b2b: parsed.isB2B,
    made_in_nepal: parsed.isLocalPreferred,
    color: parsed.attributes?.color,
    size: parsed.attributes?.size,
    urgency: parsed.urgency,
    sort_by: parsed.suggestedSort,
  };
};

/**
 * Removes keywords from query and calls callback if found
 */
function removeKeywords(
  query: string,
  keywords: string[],
  onFound: () => void
): string {
  let modified = query;
  let found = false;

  for (const keyword of keywords) {
    if (modified.includes(keyword)) {
      modified = modified.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '').trim();
      found = true;
    }
  }

  if (found) {
    onFound();
  }

  return modified;
}

/**
 * Extracts urgency level from query
 */
function extractUrgency(
  query: string,
  result: IntentParsingResult,
  onFound: () => void
): string {
  let modified = query;

  // Check for very high urgency first
  for (const keyword of URGENCY_KEYWORDS.very_high) {
    if (modified.includes(keyword)) {
      result.urgency = 'very_high';
      modified = modified.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '').trim();
      onFound();
      return modified;
    }
  }

  // Check for high urgency
  for (const keyword of URGENCY_KEYWORDS.high) {
    if (modified.includes(keyword)) {
      result.urgency = 'high';
      modified = modified.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '').trim();
      onFound();
      return modified;
    }
  }

  return modified;
}

/**
 * Extracts price constraints from query
 * Handles: "under 500", "above 1000", "between 100 and 500", "100-500"
 */
function extractPriceConstraints(query: string): { min?: number; max?: number } | null {
  const constraints: { min?: number; max?: number } = {};

  // Try "under" pattern
  const underMatch = PRICE_PATTERNS.under.exec(query);
  if (underMatch) {
    constraints.max = parseInt(underMatch[1], 10);
    return constraints;
  }

  // Try "above" pattern
  const aboveMatch = PRICE_PATTERNS.above.exec(query);
  if (aboveMatch) {
    constraints.min = parseInt(aboveMatch[1], 10);
    return constraints;
  }

  // Try "between" pattern
  const betweenMatch = PRICE_PATTERNS.between.exec(query);
  if (betweenMatch) {
    constraints.min = parseInt(betweenMatch[1], 10);
    constraints.max = parseInt(betweenMatch[2], 10);
    return constraints;
  }

  // Try range pattern "100-500"
  const rangeMatch = PRICE_PATTERNS.range.exec(query);
  if (rangeMatch) {
    const num1 = parseInt(rangeMatch[1], 10);
    const num2 = parseInt(rangeMatch[2], 10);
    // Only treat as price range if numbers are reasonable
    if (num1 < num2 && num1 > 0 && num2 < 1000000) {
      constraints.min = num1;
      constraints.max = num2;
      return constraints;
    }
  }

  return Object.keys(constraints).length > 0 ? constraints : null;
}

/**
 * Extracts color and size attributes
 */
function extractAttributes(
  query: string
): { color?: string; size?: string } | undefined {
  const attributes: { color?: string; size?: string } = {};

  // Extract color
  for (const [keyword, colorName] of Object.entries(COLOR_KEYWORDS)) {
    if (query.includes(keyword)) {
      attributes.color = colorName;
      break; // Take first match
    }
  }

  // Extract size
  for (const sizeKeyword of SIZE_KEYWORDS) {
    if (query.includes(sizeKeyword)) {
      attributes.size = sizeKeyword.toUpperCase();
      break; // Take first match
    }
  }

  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

/**
 * Cleans query by removing extra whitespace
 */
function cleanQuery(query: string): string {
  return query
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 2) // Remove small words
    .join(' ');
}

/**
 * Detects if query matches a product category
 * Useful for category-specific intent
 */
export const detectCategory = (query: string): string | null => {
  const categoryKeywords: Record<string, string[]> = {
    electronics: ['phone', 'laptop', 'computer', 'gadget', 'device', 'camera'],
    clothing: ['shirt', 'pants', 'dress', 'jacket', 'shoe', 'apparel', 'wear'],
    furniture: ['chair', 'table', 'desk', 'sofa', 'bed', 'cabinet'],
    food: ['food', 'snacks', 'grocery', 'beverage', 'drink', 'edible'],
    home: ['home', 'decor', 'kitchen', 'bathroom', 'living room'],
    beauty: ['beauty', 'makeup', 'skincare', 'cosmetic', 'fragrance'],
    sports: ['sports', 'athletic', 'fitness', 'gym', 'outdoor'],
  };

  const lowerQuery = query.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
};

/**
 * Generates human-readable explanation of detected intent
 */
export const explainIntent = (intent: SearchIntent): string => {
  const parts: string[] = [];

  if (intent.is_b2b) {
    parts.push('B2B/wholesale pricing applied');
  }

  if (intent.made_in_nepal) {
    parts.push('Local Nepal-made products prioritized');
  }

  if (intent.max_price) {
    parts.push(`Maximum price: Rs. ${intent.max_price}`);
  }

  if (intent.min_price) {
    parts.push(`Minimum price: Rs. ${intent.min_price}`);
  }

  if (intent.color) {
    parts.push(`Color: ${intent.color.toLowerCase()}`);
  }

  if (intent.urgency !== 'normal') {
    parts.push(`Delivery urgency: ${intent.urgency.replace('_', ' ')}`);
  }

  if (intent.sort_by !== 'relevance') {
    parts.push(`Sorted by: ${intent.sort_by.replace('_', ' ')}`);
  }

  return parts.length > 0 ? parts.join(' | ') : 'Standard search';
};

export default {
  parseSearchIntent,
  toSearchIntent,
  detectCategory,
  explainIntent,
};
