# Voice Search API Integration - Migration Complete

## Overview
Updated existing marketplace components to use the new **Agentic Voice Search API** instead of the old `/api/v1/marketplace/search/` endpoint.

---

## Changes Made

### 1. **ProductSearchBar.tsx**
- **Added Import**: `voiceSearchByText` from `voiceSearchApi`
- **Location**: Lines 1-19 (imports section)
- **Changes in fetchRecommendations**:
  - Tries new voice search API first
  - Falls back to old API if voice search fails
  - Maintains backward compatibility

**Before**:
```typescript
const response = await axios.get(
  `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`,
  { params: { search: debouncedQuery, limit: 8 }, ... }
);
```

**After**:
```typescript
try {
  const voiceResponse = await voiceSearchByText(debouncedQuery, 1, 8);
  setRecommendations(voiceResponse.results || []);
} catch (voiceErr) {
  // Fallback to old API
  const response = await axios.get(...);
}
```

**Benefits**:
- ✅ Intent parsing (price, B2B, location, urgency)
- ✅ Smart attribute extraction (colors, sizes)
- ✅ Prepared for personalization

---

### 2. **Marketplace.tsx**
- **Added Import**: `voiceSearchByText` from `voiceSearchApi`
- **Location**: Line 3 (imports section)
- **Changes in fetchMarketplaceProducts**:
  - Uses voice search API for search queries
  - Falls back to old API if needed
  - Maintains category filtering without search

**Before**:
```typescript
const searchUrl = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/search/`;
const { data } = await axios.get(searchUrl, { params, headers });
```

**After**:
```typescript
try {
  const voiceResponse = await voiceSearchByText(
    debouncedQuery.trim(),
    1,
    itemsPerPage
  );
  setProducts(voiceResponse.results);
  setTotalCount(voiceResponse.metadata.total_results);
} catch (voiceErr) {
  // Fallback to old API
  const searchUrl = `${...}/api/v1/marketplace/search/`;
  const { data } = await axios.get(searchUrl, { params, headers });
}
```

**Benefits**:
- ✅ Intent-based filtering and ranking
- ✅ Better search relevance
- ✅ Foundation for personalization

---

### 3. **MarketplaceAllProducts.tsx**
- **Added Imports**:
  - `voiceSearchByText` from `voiceSearchApi`
  - `parseSearchIntent`, `toSearchIntent` from `intentParserService`
- **Location**: Lines 29-31 (imports section)
- **Changes in fetchProducts**:
  - Uses voice search API when search term present
  - Falls back to old API for compatibility
  - Maintains all filter options (category, price, rating, etc.)

**Before**:
```typescript
if (debouncedSearchTerm.trim()) {
  const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/search/?...`;
  const response = await axios.get(url);
}
```

**After**:
```typescript
if (debouncedSearchTerm.trim()) {
  try {
    const voiceResponse = await voiceSearchByText(
      debouncedSearchTerm.trim(),
      currentPage,
      productsPerPage
    );
    results = voiceResponse.results;
    count = voiceResponse.metadata.total_results;
  } catch (voiceErr) {
    // Fallback to old API
    const url = `...`;
    const response = await axios.get(url);
  }
} else {
  // Non-search queries use old API for filter compatibility
}
```

**Benefits**:
- ✅ Full intent parsing for search queries
- ✅ Maintains backward compatibility with filters
- ✅ Graceful fallback strategy

---

## Fallback Strategy

All components implement a **two-tier fallback approach**:

```
┌─────────────────────────────────────────┐
│  New Voice Search API                    │
│  POST /api/market/voice-search/          │
│  (Intent parsing, ranking, B2B)          │
└─────────────────────┬───────────────────┘
                      │
          (If fails or unavailable)
                      ↓
┌─────────────────────────────────────────┐
│  Old Marketplace API                     │
│  GET /api/v1/marketplace/search/         │
│  GET /api/v1/marketplace/                │
│  (Keyword matching, category filters)    │
└─────────────────────────────────────────┘
```

This ensures:
- ✅ Zero downtime migration
- ✅ Graceful degradation
- ✅ Full backward compatibility
- ✅ Easy rollback if needed

---

## API Endpoints Used

### New Voice Search API
```
POST /api/market/voice-search/
```

**Parameters**:
- `query` (string): Search text
- `page` (int): Page number
- `page_size` (int): Results per page

**Response**:
```json
{
  "query": "bulk office chairs",
  "intent": {
    "query": "office chairs",
    "is_b2b": true,
    "max_price": null,
    "urgency": "normal"
  },
  "metadata": {
    "total_results": 145,
    "page": 1,
    "total_pages": 8,
    "page_size": 20
  },
  "results": [...]
}
```

### Old Marketplace API (Fallback)
```
GET /api/v1/marketplace/
GET /api/v1/marketplace/search/
```

---

## Testing Checklist

- [ ] Search products using text in ProductSearchBar
- [ ] Search products on Marketplace landing
- [ ] Search on MarketplaceAllProducts page
- [ ] Voice search (microphone button)
- [ ] Verify results are ranked correctly
- [ ] Check B2B pricing detection
- [ ] Verify pagination works
- [ ] Test fallback (disable voice search API to test)
- [ ] Filter combinations (price, category, rating)
- [ ] Mobile search functionality

---

## Environment Variables

Ensure your `.env` file has:
```
VITE_REACT_APP_API_URL=http://your-api.com
```

The voice search API endpoint is configured automatically:
```
POST ${VITE_REACT_APP_API_URL}/api/market/voice-search/
```

---

## Features Now Available

### In Search Results
1. **Intent Visualization**: Shows detected intent (B2B, price range, urgency, colors)
2. **Dual Pricing**: B2B prices shown when detected
3. **Attribute Filtering**: Colors, sizes automatically extracted
4. **Delivery Urgency**: Fast delivery prioritization
5. **Geographic Boost**: Local products highlighted (when requested)

### Examples of Detected Intents

| Query | Intent |
|-------|--------|
| "wholesale red bricks under 500" | B2B=true, color=RED, max_price=500 |
| "local handicrafts" | made_in_nepal=true |
| "urgent laptop today" | urgency=high, sort_by=delivery_speed |
| "blue shoes between 1000-2000" | color=BLUE, min_price=1000, max_price=2000 |

---

## Performance Improvements

- **Intent Parsing**: Extracts meaning, not just keywords
- **Better Ranking**: Two-stage pipeline (retrieval + personalization)
- **Relevant Results**: Context-aware product matching
- **B2B Support**: Automatic B2B pricing and quantity detection

---

## Error Handling

All components gracefully handle:
- ✅ Voice search API timeouts
- ✅ Invalid audio formats
- ✅ Speech service unavailability
- ✅ Network errors
- ✅ Falls back to keyword search

---

## Future Enhancements

Once backend supports personalization:
1. Add user interaction tracking
2. Enable hyper-personalization ranking
3. Show personalization insights in results
4. Track user category/brand preferences
5. Boost products from liked brands
6. Remember purchase history

---

## Migration Summary

| Component | Old API | New API | Status |
|-----------|---------|---------|--------|
| ProductSearchBar | `/api/v1/marketplace/` | `/api/market/voice-search/` | ✅ Updated |
| Marketplace | `/api/v1/marketplace/search/` | `/api/market/voice-search/` | ✅ Updated |
| MarketplaceAllProducts | `/api/v1/marketplace/search/` | `/api/market/voice-search/` | ✅ Updated |

**All components now use the new Voice Search API with fallback support.**
