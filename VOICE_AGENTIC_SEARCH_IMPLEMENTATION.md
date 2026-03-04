# Voice & Agentic Search API Implementation

Complete implementation of LLM-style intent parsing for voice and natural language search. Provides hyper-personalized product recommendations through a two-stage ranking pipeline.

---

## Overview

The Voice & Agentic Search system converts natural language queries (voice or text) into structured search intents, applies intelligent filtering and personalization, and returns ranked product recommendations.

### Key Features

- **Natural Language Intent Parsing**: Extracts price constraints, B2B context, geographic preferences, urgency, and attributes
- **Two-Stage Ranking Pipeline**: 
  1. **Retrieval**: Filters by intent (B2B pricing, price range, geography)
  2. **Personalization**: Boosts products based on user interaction history
- **B2B/B2C Dual Pricing**: Detects bulk/wholesale context and applies appropriate pricing
- **Geographic Boosting**: Prioritizes Nepal-made products when requested
- **Urgency Detection**: Sorts by delivery speed for time-sensitive searches
- **Speech Recognition Integration**: Browser-native Web Speech API support
- **Hyper-Personalization**: Boosts results based on user's purchase history, viewed products, and brand affinity

---

## Architecture

### File Structure

```
src/
├── api/
│   └── voiceSearchApi.ts           # API integration layer
├── services/
│   ├── intentParserService.ts       # LLM-style intent extraction
│   └── recommendationEngineService.ts # Two-stage ranking pipeline
├── hooks/
│   └── useVoiceSearch.ts            # React hook for voice search
├── components/
│   ├── VoiceSearchResults.tsx       # Results display component
│   └── VoiceSearchExample.tsx       # Full integration example
└── types/
    └── voiceSearch.ts              # TypeScript interfaces
```

### Data Flow

```
User Query (Voice/Text)
    ↓
[Validation]
    ↓
[Intent Parsing] ← Extracts: price, B2B, location, urgency, attributes
    ↓
[API Request] ← `POST /api/market/voice-search/`
    ↓
[Retrieval Phase] ← Filters by intent constraints
    ↓
[Sorting Phase] ← Sorts by: price, delivery speed, relevance
    ↓
[Personalization Phase] ← Boosts based on user interaction history
    ↓
[Results Display] ← Ranked & personalized products
```

---

## Components

### 1. Voice Search Types (`src/types/voiceSearch.ts`)

Core TypeScript interfaces:

```typescript
// Search intent extracted from natural language
interface SearchIntent {
  query: string;              // Core search term
  min_price?: number;         // Price constraints
  max_price?: number;
  is_b2b: boolean;           // B2B context
  made_in_nepal: boolean;    // Local preference
  color?: string;            // Extracted attributes
  size?: string;
  urgency: 'normal' | 'high' | 'very_high';
  sort_by: 'price_asc' | 'price_desc' | 'delivery_speed' | 'relevance';
}

// Product result with dual pricing
interface VoiceSearchProduct {
  id: number;
  name: string;
  listed_price: number;      // Consumer price
  b2b_price?: number;        // Wholesale price
  discounted_price?: number;
  is_made_in_nepal: boolean;
  estimated_delivery_days?: number;
  is_available: boolean;
  // ... other fields
}

// Complete API response
interface VoiceSearchResponse {
  query: string;
  intent: SearchIntent;
  metadata: PaginationMetadata;
  results: VoiceSearchProduct[];
}
```

### 2. Voice Search API (`src/api/voiceSearchApi.ts`)

HTTP API client for voice search endpoint:

```typescript
// Main search function
export const performVoiceSearch = async (
  request: VoiceSearchRequest
): Promise<VoiceSearchResponse>

// Convenience wrappers
export const voiceSearchByText = (query: string, page?: number, pageSize?: number)
export const voiceSearchByAudio = (audioFile: File, page?: number, pageSize?: number)
export const personalizedVoiceSearch = (query: string, userId: number, ...)
export const b2bVoiceSearch = (query: string, page?: number, pageSize?: number)
export const localVoiceSearch = (query: string, page?: number, pageSize?: number)
export const urgentVoiceSearch = (query: string, page?: number, pageSize?: number)
```

**Endpoint**: `POST /api/market/voice-search/`

**Request**:
```json
{
  "query": "wholesale red bricks under 500",
  "page": 1,
  "page_size": 20,
  "user_id": 123
}
```

**Response**:
```json
{
  "query": "wholesale red bricks under 500",
  "intent": {
    "query": "bricks",
    "max_price": 500.0,
    "is_b2b": true,
    "made_in_nepal": false,
    "color": "RED",
    "urgency": "normal",
    "sort_by": "price_asc"
  },
  "metadata": {
    "total_results": 142,
    "page": 1,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false,
    "page_size": 20
  },
  "results": [
    {
      "id": 1024,
      "name": "Standard Red Brick - Grade A",
      "b2b_price": 450.0,
      "listed_price": 600.0,
      "is_made_in_nepal": true,
      "estimated_delivery_days": 2
    }
  ]
}
```

### 3. Intent Parser Service (`src/services/intentParserService.ts`)

LLM-style natural language parsing:

```typescript
// Main parsing function
export const parseSearchIntent = (query: string): IntentParsingResult

// Converts to SearchIntent for API
export const toSearchIntent = (parsed: IntentParsingResult): SearchIntent

// Detects product category
export const detectCategory = (query: string): string | null

// Generates human-readable explanation
export const explainIntent = (intent: SearchIntent): string
```

**Detected Intents**:
- **Price Brackets**: "under 500", "above 1000", "between 100 and 500"
- **B2B Keywords**: "wholesale", "bulk", "business", "commercial"
- **Local Products**: "local", "swadeshi", "made in nepal"
- **Urgency**: "fast", "today", "urgent", "asap"
- **Colors**: "red", "blue", "green", "black", etc.
- **Sizes**: "small", "medium", "large", "xl", etc.

**Example**:

```typescript
const parsed = parseSearchIntent("wholesale red bricks under 500");
// Returns:
// {
//   query: "bricks",
//   priceConstraints: { max: 500 },
//   isB2B: true,
//   isLocalPreferred: false,
//   attributes: { color: "RED" },
//   urgency: "normal",
//   suggestedSort: "price_asc",
//   confidence: 0.92
// }

const explanation = explainIntent(parsed.intent);
// "B2B/wholesale pricing applied | Maximum price: Rs. 500 | Color: red"
```

### 4. Recommendation Engine (`src/services/recommendationEngineService.ts`)

Two-stage ranking pipeline:

```typescript
// Complete ranking pipeline
export const rankProducts = async (
  products: VoiceSearchProduct[],
  intent: SearchIntent,
  userInteractions: UserInteraction[] | null,
  userId?: number
): Promise<VoiceSearchProduct[]>

// Individual ranking stages
export const filterByIntent = (products: any[], intent: SearchIntent)
export const sortByIntent = (products: any[], sortBy: string, intent: SearchIntent)
export const applyGeographicBoost = (products: any[], intent: SearchIntent)
export const applyUrgencyBoost = (products: any[], urgency: string)
export const applyHyperPersonalization = async (products: any[], intent: SearchIntent, ...)
```

**Ranking Stages**:

1. **Retrieval Phase**: Filters products by intent
   - B2B pricing context
   - Price range constraints
   - Geographic preferences
   - Availability

2. **Sorting Phase**: Orders by suggested sort
   - `price_asc`: Lowest to highest
   - `price_desc`: Highest to lowest
   - `delivery_speed`: Fastest delivery first
   - `relevance`: Featured, rating, recency

3. **Personalization Phase**: Re-ranks based on user history
   - Category match (30% weight)
   - Brand affinity (20% weight)
   - Purchase history (30% weight)
   - Recent views (15% weight)
   - Price match (5% weight)

### 5. Voice Search Hook (`src/hooks/useVoiceSearch.ts`)

React hook for voice search integration:

```typescript
const {
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
  hasNextPage,
  hasPreviousPage,
} = useVoiceSearch({
  enableSpeechRecognition: true,
  autoSearch: false,
  language: 'en-US',
  userId: 123,
  userInteractions: historyData,
  onSearchComplete: (results) => {},
  onError: (error) => {},
});
```

**Features**:
- Browser-native Web Speech API integration
- Real-time speech-to-text transcription
- Intent parsing and validation
- Personalized result ranking
- Pagination support
- Error handling

### 6. Voice Search Results Component (`src/components/VoiceSearchResults.tsx`)

Display component for search results:

```typescript
<VoiceSearchResults
  results={products}
  query="office chairs"
  intent={searchIntent}
  isLoading={loading}
  error={errorMessage}
  totalResults={150}
  currentPage={1}
  totalPages={8}
  onProductClick={(product) => navigate(`/product/${product.id}`)}
  onAddToCart={(product) => addToCart(product)}
  onPageChange={(page) => goToPage(page)}
  showPersonalizationInsights={true}
/>
```

**Features**:
- Grid/List view toggle
- Intent badges (B2B, Local, Price, Urgency)
- Product cards with:
  - Dual pricing (B2B/Consumer)
  - Delivery estimates
  - Ratings and reviews
  - Attributes (color, size)
  - Personalization insights
- Pagination controls
- Error handling

---

## Usage Examples

### Basic Text Search

```typescript
import { voiceSearchByText } from '@/api/voiceSearchApi';

const results = await voiceSearchByText("bulk office chairs under $500");
console.log(results.intent); // Extracted intent
console.log(results.results); // Ranked products
```

### With Voice Input

```typescript
import useVoiceSearch from '@/hooks/useVoiceSearch';

function SearchComponent() {
  const {
    isListening,
    results,
    startListening,
    performSearch,
  } = useVoiceSearch({
    enableSpeechRecognition: true,
    autoSearch: true, // Auto-search when listening stops
  });

  return (
    <div>
      <button onClick={startListening}>
        {isListening ? '🎤 Listening...' : '🎙️ Start Voice Search'}
      </button>
      {results.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### With User Personalization

```typescript
const userId = parseInt(localStorage.getItem('user_id') || '0');
const userInteractions = await fetchUserInteractions(userId);

const {
  results,
  intentExplanation,
  performSearch,
} = useVoiceSearch({
  userId,
  userInteractions,
  enableSpeechRecognition: true,
});

await performSearch("red bricks");
// Results boosted based on user's history
```

### B2B-Specific Search

```typescript
const { performB2BSearch, results } = useVoiceSearch({
  userId: 456,
  userInteractions,
});

// Triggers B2B pricing and bulk-order prioritization
await performB2BSearch("industrial machinery");
```

### Local Products Search

```typescript
const { performLocalSearch } = useVoiceSearch();

// Prioritizes Nepal-made products
await performLocalSearch("handicrafts");
```

### Urgent/Fast Delivery Search

```typescript
const { performUrgentSearch } = useVoiceSearch();

// Sorts by delivery speed, prioritizes express shipping
await performUrgentSearch("laptop stand");
```

### Complete Integration Example

```typescript
import { VoiceSearchExample } from '@/components/VoiceSearchExample';

export default function Marketplace() {
  return <VoiceSearchExample />;
}
```

---

## Intent Detection Examples

| Query | Detected Intent | Explanation |
| --- | --- | --- |
| "wholesale red bricks under 500" | `{query: "bricks", max_price: 500, is_b2b: true, color: "RED"}` | B2B context, price constraint, color |
| "local handicrafts" | `{query: "handicrafts", made_in_nepal: true}` | Geographic preference |
| "urgent laptop today" | `{query: "laptop", urgency: "high", sort_by: "delivery_speed"}` | Time-sensitive, fast delivery |
| "blue shoes between 1000 and 2000" | `{query: "shoes", min_price: 1000, max_price: 2000, color: "BLUE"}` | Price range, color |
| "bulk office furniture under 10000" | `{query: "office furniture", max_price: 10000, is_b2b: true}` | B2B, price limit |

---

## Error Handling

### API Error Codes

| Status | Code | Message | Resolution |
| --- | --- | --- | --- |
| 400 | `MISSING_QUERY` | Query or audio file required | Provide either query or audio file |
| 400 | `INVALID_AUDIO` | Invalid audio format | Use WAV, MP3, OGG, or WebM |
| 503 | `SPEECH_SERVICE_ERROR` | Speech service unavailable | Retry later or use text input |
| 504 | `SERVER_ERROR` | Request timeout | Simplify query or try again |

### Handling Errors

```typescript
const { error } = useVoiceSearch();

if (error) {
  if (error.code === 'SPEECH_SERVICE_ERROR') {
    return <p>Speech service temporarily unavailable. Please try text search.</p>;
  }
  return <p>Error: {error.message}</p>;
}
```

---

## Browser Support

| Browser | Support | Notes |
| --- | --- | --- |
| Chrome/Edge | ✅ | Full support |
| Safari | ✅ | Full support |
| Firefox | ⚠️ | Requires configuration |
| Opera | ✅ | Full support |
| Mobile Safari | ✅ | iOS 14.5+ |
| Chrome Android | ✅ | Full support |

---

## Performance Considerations

- **Request Timeout**: 30 seconds (configurable)
- **Result Caching**: Implement caching for frequently searched queries
- **Debouncing**: Use debounce for real-time typing (500ms recommended)
- **Pagination**: Default 20 results per page
- **Maximum Page Size**: 100 results per page

---

## Backend Requirements

The backend must implement: `POST /api/market/voice-search/`

### Request Parameters
- `query` (string, optional): Text query
- `audio_file` (file, optional): Audio file for speech-to-text
- `page` (int, optional): Page number (default 1)
- `page_size` (int, optional): Results per page (default 20, max 100)
- `user_id` (int, optional): User ID for personalization

### Response Format
See `VoiceSearchResponse` interface in `src/types/voiceSearch.ts`

---

## Future Enhancements

- [ ] Multi-language support
- [ ] Accent/dialect handling
- [ ] Advanced attribute extraction (material, brand, etc.)
- [ ] Category-aware ranking
- [ ] A/B testing framework
- [ ] Analytics dashboard
- [ ] Real-time trending suggestions
- [ ] Smart query correction/autocomplete

---

## Testing

```typescript
// Mock test example
describe('Voice Search', () => {
  it('should parse intent correctly', () => {
    const result = parseSearchIntent("wholesale red bricks under 500");
    expect(result.isB2B).toBe(true);
    expect(result.priceConstraints?.max).toBe(500);
    expect(result.attributes?.color).toBe('RED');
  });

  it('should detect urgency', () => {
    const result = parseSearchIntent("urgent laptop today");
    expect(result.urgency).toBe('high');
    expect(result.suggestedSort).toBe('delivery_speed');
  });

  it('should rank products by personalization', async () => {
    const ranked = await rankProducts(products, intent, userInteractions, userId);
    expect(ranked[0].brand).toBe('FavoriteBrand'); // User's preferred brand
  });
});
```

---

## Troubleshooting

### Voice Input Not Working
- Check browser compatibility (Chrome, Safari, Edge)
- Ensure microphone permissions granted
- Check browser console for errors

### No Results Returned
- Verify query is not empty
- Check internet connection
- Try a simpler query
- Check if server is running

### Results Not Personalized
- Ensure `userId` is provided to hook
- Verify user interaction history is fetched
- Check that user has purchase/view history

---

## References

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Intent Recognition](https://en.wikipedia.org/wiki/Intent_recognition)
- [Two-Stage Ranking](https://en.wikipedia.org/wiki/Information_retrieval#Ranking)
