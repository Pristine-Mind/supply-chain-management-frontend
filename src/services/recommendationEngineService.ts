/**
 * Recommendation Engine Service
 * Two-stage ranking pipeline: Retrieval + Hyper-Personalization
 * Boosts products based on user interaction history
 */

import {
  VoiceSearchProduct,
  RecommendationBoost,
  UserInteraction,
  SearchIntent,
} from '../types/voiceSearch';

/**
 * Ranking configuration for boost calculations
 */
const RANKING_CONFIG = {
  categoryMatchWeight: 0.3,
  brandMatchWeight: 0.2,
  purchaseHistoryWeight: 0.3,
  recentViewWeight: 0.15,
  priceMatchWeight: 0.02,
};

/**
 * Applies hyper-personalization to search results
 * Two-stage pipeline:
 * 1. Retrieval Phase: Filter by intent (B2B, price, geography)
 * 2. Personalization Phase: Re-rank with user interaction history
 * 
 * @param products - Products returned from API (already filtered by intent)
 * @param intent - Extracted search intent
 * @param userInteractions - User's interaction history (optional)
 * @param userId - User ID for personalization
 * @returns Re-ranked products with personalization applied
 * 
 * @example
 * const personalized = await applyHyperPersonalization(
 *   products,
 *   intent,
 *   userHistory,
 *   userId
 * );
 */
export const applyHyperPersonalization = async (
  products: VoiceSearchProduct[],
  intent: SearchIntent,
  userInteractions: UserInteraction[] | null,
  userId?: number
): Promise<VoiceSearchProduct[]> => {
  // If no user interactions or not authenticated, return as-is
  if (!userInteractions || userInteractions.length === 0 || !userId) {
    return products;
  }

  // Calculate boost scores for each product
  const boosts = new Map<number, RecommendationBoost>();

  for (const product of products) {
    const boost = calculateProductBoost(product, userInteractions, intent);
    boosts.set(product.id, boost);
  }

  // Re-rank products by boost score
  const ranked = [...products].sort((a, b) => {
    const boostA = boosts.get(a.id)?.boost_score || 0;
    const boostB = boosts.get(b.id)?.boost_score || 0;
    return boostB - boostA; // Descending order
  });

  return ranked;
};

/**
 * Calculates personalization boost for a single product
 * Based on: category history, brand affinity, purchase history, recent views
 * 
 * @param product - Product to evaluate
 * @param userInteractions - User interaction history
 * @param intent - Search intent
 * @returns Recommendation boost with reason
 */
function calculateProductBoost(
  product: VoiceSearchProduct,
  userInteractions: UserInteraction[],
  intent: SearchIntent
): RecommendationBoost {
  let boostScore = 0;
  let reason: RecommendationBoost['reason'] = 'relevance';

  // Check for category match
  const categoryInteractions = userInteractions.filter(
    (i) => i.category_id === product.id // Note: This would need actual category_id from product
  );

  if (categoryInteractions.length > 0) {
    const categoryBoost = Math.min(0.3, categoryInteractions.length * 0.1);
    boostScore += categoryBoost * RANKING_CONFIG.categoryMatchWeight;
    reason = 'category_match';
  }

  // Check for brand match
  const brandInteractions = userInteractions.filter(
    (i) => i.brand_id && product.brand && i.brand_id.toString() === product.brand
  );

  if (brandInteractions.length > 0) {
    const brandBoost = Math.min(0.3, brandInteractions.length * 0.1);
    boostScore += brandBoost * RANKING_CONFIG.brandMatchWeight;
    if (reason === 'category_match') {
      reason = 'category_match'; // Keep category if both
    } else {
      reason = 'brand_match';
    }
  }

  // Check for purchase history
  const purchaseInteractions = userInteractions.filter(
    (i) => i.product_id === product.id && i.interaction_type === 'purchase'
  );

  if (purchaseInteractions.length > 0) {
    boostScore += 0.25; // Strong signal for repurchase
    reason = 'purchase_history';
  }

  // Check for recent views
  const viewInteractions = userInteractions.filter(
    (i) => i.product_id === product.id && i.interaction_type === 'view'
  );

  if (viewInteractions.length > 0) {
    const timeSinceView = Date.now() - new Date(viewInteractions[0].timestamp).getTime();
    const daysAgo = timeSinceView / (1000 * 60 * 60 * 24);

    // Decay boost over time (max 5 days)
    if (daysAgo < 5) {
      const recentBoost = (1 - daysAgo / 5) * 0.2;
      boostScore += recentBoost * RANKING_CONFIG.recentViewWeight;
      reason = 'recent_view';
    }
  }

  // Slight boost for price match if intent has price constraint
  if (intent.max_price && product.listed_price <= intent.max_price) {
    boostScore += 0.05 * RANKING_CONFIG.priceMatchWeight;
  }

  // Ensure score stays between 0 and 1
  boostScore = Math.min(1, Math.max(0, boostScore));

  return {
    product_id: product.id,
    boost_score: boostScore,
    reason,
  };
}

/**
 * Filters products based on search intent constraints
 * Applies B2B context, price ranges, geographic preferences
 * 
 * @param products - Raw products from API
 * @param intent - Extracted search intent
 * @returns Filtered products matching intent
 */
export const filterByIntent = (
  products: VoiceSearchProduct[],
  intent: SearchIntent
): VoiceSearchProduct[] => {
  return products.filter((product) => {
    // B2B pricing context
    if (intent.is_b2b && !product.b2b_price) {
      return false; // Skip if B2B context but no B2B pricing
    }

    // Price constraints
    const priceToCheck = intent.is_b2b ? product.b2b_price : product.listed_price;
    if (intent.max_price && priceToCheck && priceToCheck > intent.max_price) {
      return false;
    }

    if (intent.min_price && priceToCheck && priceToCheck < intent.min_price) {
      return false;
    }

    // Geographic preference
    if (intent.made_in_nepal && !product.is_made_in_nepal) {
      // Still include, but will be sorted lower
    }

    // Attribute matching
    if (intent.color && product.color && !product.color.includes(intent.color)) {
      return false;
    }

    // Product must be available
    if (!product.is_available) {
      return false;
    }

    return true;
  });
};

/**
 * Sorts products by extraction intent's suggested sort order
 * 
 * @param products - Products to sort
 * @param sortBy - Sort preference from intent
 * @param intent - Full intent object for context
 * @returns Sorted products
 */
export const sortByIntent = (
  products: VoiceSearchProduct[],
  sortBy: SearchIntent['sort_by'],
  intent: SearchIntent
): VoiceSearchProduct[] => {
  const sorted = [...products];

  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => {
        const priceA = intent.is_b2b ? a.b2b_price : a.listed_price;
        const priceB = intent.is_b2b ? b.b2b_price : b.listed_price;
        return (priceA || 0) - (priceB || 0);
      });

    case 'price_desc':
      return sorted.sort((a, b) => {
        const priceA = intent.is_b2b ? a.b2b_price : a.listed_price;
        const priceB = intent.is_b2b ? b.b2b_price : b.listed_price;
        return (priceB || 0) - (priceA || 0);
      });

    case 'delivery_speed':
      return sorted.sort((a, b) => {
        const daysA = a.estimated_delivery_days || 999;
        const daysB = b.estimated_delivery_days || 999;
        // Boost featured products with fast delivery
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return daysA - daysB;
      });

    case 'relevance':
    default:
      // Sort by featured first, then rating, then recency
      return sorted.sort((a, b) => {
        if (a.is_featured !== b.is_featured) {
          return a.is_featured ? -1 : 1;
        }
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });
  }
};

/**
 * Applies geographic boost to products based on intent
 * Prioritizes Nepal-made products if "local" was in query
 * 
 * @param products - Products to boost
 * @param intent - Search intent
 * @returns Products with geographic preferences applied
 */
export const applyGeographicBoost = (
  products: VoiceSearchProduct[],
  intent: SearchIntent
): VoiceSearchProduct[] => {
  if (!intent.made_in_nepal) {
    return products;
  }

  // Sort so Nepal-made products appear first
  return [...products].sort((a, b) => {
    if (a.is_made_in_nepal === b.is_made_in_nepal) return 0;
    return a.is_made_in_nepal ? -1 : 1;
  });
};

/**
 * Applies urgency/delivery speed boost based on intent
 * 
 * @param products - Products to sort
 * @param urgency - Detected urgency level
 * @returns Products sorted by delivery speed if urgent
 */
export const applyUrgencyBoost = (
  products: VoiceSearchProduct[],
  urgency: SearchIntent['urgency']
): VoiceSearchProduct[] => {
  if (urgency === 'normal') {
    return products;
  }

  // Sort by delivery speed, with high-urgency products first
  return [...products].sort((a, b) => {
    const daysA = a.estimated_delivery_days || 999;
    const daysB = b.estimated_delivery_days || 999;

    // Prioritize same-day or next-day delivery
    if (daysA <= 1 && daysB > 1) return -1;
    if (daysA > 1 && daysB <= 1) return 1;

    return daysA - daysB;
  });
};

/**
 * Combines all personalization and intent-based ranking
 * Complete two-stage pipeline for ranking
 * 
 * @param products - Products from API
 * @param intent - Extracted search intent
 * @param userInteractions - User interaction history
 * @param userId - User ID
 * @returns Fully ranked and personalized products
 */
export const rankProducts = async (
  products: VoiceSearchProduct[],
  intent: SearchIntent,
  userInteractions: UserInteraction[] | null,
  userId?: number
): Promise<VoiceSearchProduct[]> => {
  // Stage 1: Retrieval (filtering)
  let filtered = filterByIntent(products, intent);

  // Stage 2: Ranking by intent
  let ranked = sortByIntent(filtered, intent.sort_by, intent);

  // Apply special boosts
  ranked = applyGeographicBoost(ranked, intent);
  ranked = applyUrgencyBoost(ranked, intent.urgency);

  // Stage 3: Hyper-personalization (for authenticated users)
  ranked = await applyHyperPersonalization(ranked, intent, userInteractions, userId);

  return ranked;
};

/**
 * Generates personalization insights for UI display
 * Shows user why products are recommended
 * 
 * @param product - Recommended product
 * @param boost - Boost information
 * @returns Human-readable explanation
 * 
 * @example
 * const insight = getPersonalizationInsight(product, boost);
 * // "You viewed similar products recently"
 */
export const getPersonalizationInsight = (
  product: VoiceSearchProduct,
  boost: RecommendationBoost
): string => {
  switch (boost.reason) {
    case 'category_match':
      return 'Based on your category preferences';
    case 'brand_match':
      return `You like the ${product.brand} brand`;
    case 'purchase_history':
      return 'You purchased similar items before';
    case 'recent_view':
      return 'You recently viewed similar products';
    default:
      return 'Recommended for you';
  }
};

export default {
  applyHyperPersonalization,
  filterByIntent,
  sortByIntent,
  applyGeographicBoost,
  applyUrgencyBoost,
  rankProducts,
  getPersonalizationInsight,
};
