# Seller Profile Features Documentation

## Overview
The Seller Profile feature enables customers to view individual seller information and browse all products offered by a specific seller. This document covers all features, components, and functionality.

---

## Table of Contents
1. [Core Features](#core-features)
2. [Component Architecture](#component-architecture)
3. [User Workflows](#user-workflows)
4. [UI Features](#ui-features)
5. [Data Management](#data-management)
6. [Error Handling](#error-handling)
7. [SEO & Accessibility](#seo--accessibility)

---

## Core Features

### 1. Seller Profile Display
Display comprehensive seller information on a dedicated profile page.

**Features:**
- Seller name (with business name fallback)
- Profile image with avatar placeholder
- Business type badge (distributor/retailer)
- B2B verification badge
- Bio/description text
- Location information (city, state, country)
- Total products count
- Contact information display
- Geo-location data (latitude/longitude)

**Location:** `/marketplace/seller/:sellerSlug`

**Example:**
```
URL: /marketplace/seller/farmfresh_store
Displays: Farm Fresh Nepal's complete profile
```

---

### 2. Seller Products Browsing
Browse all products offered by a specific seller with full marketplace features.

**Features:**
- Grid layout (responsive: 2-5 columns based on screen size)
- Product cards with:
  - Product image
  - Product name (2-line truncation)
  - Price and discounted price
  - Discount percentage badge (e.g., "25% OFF")
  - Star rating with review count
  - Stock status indicator (green/yellow/red dot)
  - "Add to Cart" button
  - Availability status
- Product count display
- Empty state handling

**Responsive Breakpoints:**
```
Mobile (< 640px):  2 columns
Tablet (640-1024px): 3-4 columns
Desktop (1024px+):   4-5 columns
```

---

### 3. Product Pagination
Navigate through seller's products efficiently.

**Features:**
- Page-based pagination (default 20 products/page)
- Smart page number display:
  - Shows first, last, current ±2 pages
  - Shows ellipsis for skipped ranges
- Current page indicator (highlighted)
- Previous/Next buttons
- Disabled state for boundary pages
- Result counter ("X–Y of Z products")
- Smooth scroll to top on page change

**Example:**
```
Pages: [1] ... [3] [4] [5] [6] ... [10]
Current: 5
Display: "41–60 of 200 products"
```

---

### 4. Product Filtering & Search
Find products within a seller's catalog.

**Features:**
- Quick search by product name
- Category-based browsing
- Price range filtering
- Stock status filtering
- Sorting options
- Active filter indicators

**Note:** Advanced filters are inherited from global marketplace filters.

---

### 5. Shopping Integration
Add seller's products to cart directly from profile.

**Features:**
- One-click "Add to Cart" button
- Stock validation before adding
- Availability checking
- Cart context integration
- Login modal for unauthenticated users
- Success feedback ("Added!" state for 2 seconds)
- Quantity input (default 1)
- Real-time inventory sync

**User Flow:**
```
1. Click "Add to Cart"
2. System checks: User authenticated? → Product available? → Stock > 0?
3. If checks pass: Add to cart
4. If user not authenticated: Show login modal
5. Display success message for 2 seconds
```

---

### 6. Seller Discovery
Find sellers through search and filtering.

**Features:**
- Search sellers by username, name, or bio
- Filter by business type:
  - Distributor
  - Retailer
- Filter by B2B verification status
- Browse all verified sellers
- View seller ratings and reviews

**Example Search:**
```typescript
// Find all B2B verified distributors
const distributors = await getSellerProfiles({
  business_type: 'distributor',
  b2b_verified: true,
  page: 1,
  page_size: 20
});
```

---

### 7. Seller Verification Badges
Display trust indicators for sellers.

**Badge Types:**

#### B2B Verified Badge
- Blue badge with checkmark
- Indicates B2B business verification
- Shown in seller hero card

#### Business Type Badge
- Green badge with store icon
- Shows: "Distributor" or "Retailer"
- Helps customers identify seller type

**Example:**
```
┌─────────────────────────┐
│ [Avatar] Farm Fresh     │
│          ✓ B2B Verified │
│          🏪 Distributor │
│                         │
│ Location: Kathmandu     │
│ 42 products available   │
└─────────────────────────┘
```

---

### 8. Product Availability Indicators

**Stock Status Dot Colors:**
- 🟢 Green: 10+ items in stock
- 🟡 Yellow: 1-9 items in stock
- 🔴 Red: Out of stock (0 items)

**Availability Overlay:**
- "Unavailable" label over product image (semi-transparent)
- Disabled "Add to Cart" button
- Grayed out button styling

---

### 9. Price Display & Discounts

**Features:**
- Original listed price
- Discounted price (when applicable)
- Discount percentage badge
- Strike-through original price
- Orange color for sale prices
- Currency formatting (Rs. format)

**Example:**
```
₹ 99 ~~₹120~~ (18% OFF)
```

---

### 10. Search Bar Integration
Quick navigation from seller profile.

**Features:**
- Sticky search bar at top
- Works from any page
- Category quick-access
- Global product search
- Maintains context

---

### 11. SEO & Meta Information

**Features:**
- Dynamic page title: `{sellerName} — Seller on Mulya Bazzar`
- Meta description with seller info and product count
- OpenGraph image (seller profile image)
- Structured data (Schema.org):
  - Store entity type
  - Store name, image, address
  - Postal address with location details
- Canonical URL
- Mobile-responsive viewport

**Example Title:**
```
"Farm Fresh Nepal — Seller on Mulya Bazzar"
"Shop from Farm Fresh Nepal on Mulya Bazzar. 
42 products available · Based in Kathmandu, Central, NP"
```

---

### 12. Back Navigation
Easy return to previous page.

**Features:**
- Back button in header
- Back button functionality
- Browser history support
- Active link styling
- Smooth transitions

---

### 13. Loading States

**Features:**
- Initial profile loading skeleton
- Products grid skeleton (8 items)
- Skeleton animation (pulse effect)
- Product page loading state
- Graceful degradation

---

### 14. Error Handling & Fallbacks

**Features:**
- Seller not found error page
- Error message display
- Graceful fallback images
- Fallback display names
- Retry functionality
- User-friendly error messages

---

## Component Architecture

### Main Component: `SellerProfilePage`

**File:** `src/components/SellerProfilePage.tsx`

**Props:** None (uses React Router params)

**Hooks Used:**
- `useParams()` - Get seller slug from URL
- `useNavigate()` - Navigation
- `useCart()` - Cart operations
- `useAuth()` - User authentication
- `useState()` - Local state management
- `useCallback()` - Memoized callbacks
- `useEffect()` - Side effects

**State Variables:**
```typescript
const [seller, setSeller] = useState<SellerProfile | null>(null);
const [loading, setLoading] = useState(true);
const [productsLoading, setProductsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [pagination, setPagination] = useState<SellerProductsPagination | null>(null);
const [products, setProducts] = useState<SellerMarketplaceProduct[]>([]);
const [resolvedId, setResolvedId] = useState<number | null>(null);
```

---

### Component Sections

#### 1. Seller Slug Resolution
```
Input: sellerSlug (URL param)
       ↓
Process: getSellerProfiles({ search: sellerSlug })
         ↓
Output: resolvedId (seller's actual ID)
```

#### 2. Profile Data Loading
```
Input: resolvedId
       ↓
Process: getSellerProfileById(resolvedId, { products_page: 1 })
         ↓
Output: seller, products, pagination
```

#### 3. Product Pagination
```
Input: currentPage
       ↓
Process: getSellerProfileById(resolvedId, { products_page: currentPage })
         ↓
Output: Updated products, pagination
         Scroll to top
```

---

### Child Components & Integrations

| Component | Usage | Purpose |
|-----------|-------|---------|
| `ProductSearchBar` | Header | Search and navigation |
| `Footer` | Bottom | Site footer |
| `SEOHead` | Head | Meta tags and structured data |
| `LoginModal` | Modal | User authentication |
| Lucide Icons | Throughout | UI icons (Star, MapPin, Store, etc.) |

---

## User Workflows

### Workflow 1: Browse Seller Profile
```
1. User clicks seller link (from marketplace, product page, etc.)
2. URL changes to /marketplace/seller/{sellerSlug}
3. System resolves sellerSlug to seller ID
4. Fetch seller profile + first page of products
5. Display seller hero card with information
6. Display products in grid with pagination
7. User scrolls and reads seller info
```

### Workflow 2: Browse Seller's Products
```
1. User views seller profile
2. Sees paginated grid of products
3. Can change pages using pagination controls
4. Views product details inline
5. Can click product to go to detail page
6. Can add products directly to cart
```

### Workflow 3: Add Product to Cart
```
1. User clicks "Add to Cart" on product card
2. System checks: Is user logged in?
   - NO: Show login modal
   - YES: Continue
3. Check: Product available & stock > 0?
   - NO: Show "Unavailable"
   - YES: Add to cart
4. Display "Added!" confirmation (2 seconds)
5. Cart count updates in header
```

### Workflow 4: Search for Sellers
```
1. User clicks on "Sellers" or uses search
2. Views seller discovery page
3. Searches by name/username
4. Filters by business type (distributor/retailer)
5. Filters by B2B verification
6. Browses results
7. Clicks seller to view profile
```

---

## UI Features

### Responsive Design
**Mobile First Approach**
- Stacked layout on mobile
- Grid layout on tablet/desktop
- Touch-friendly buttons (min 44x44px)
- Readable font sizes

**Breakpoints:**
```css
xs: < 640px   (mobile)
sm: 640px+    (small tablet)
lg: 1024px+   (tablet/desktop)
xl: 1280px+   (large desktop)
```

### Visual Hierarchy
1. **Hero Section**: Large seller card with prominent image
2. **Products Title**: Bold section heading
3. **Product Grid**: Equal-weight product cards
4. **Pagination**: Footer controls

### Color Scheme
- **Orange Primary**: #F97316 (action buttons, highlights)
- **Gray Neutral**: #737373 (text, borders)
- **Green Success**: #22C55E (stock available)
- **Yellow Warning**: #EAB308 (low stock)
- **Red Danger**: #EF4444 (out of stock)
- **Blue Info**: #3B82F6 (B2B badge)

### Interactive Elements
- Hover effects on product cards (shadow increase)
- Button hover states (color changes)
- Loading skeletons (pulse animation)
- Active page indicator (bold background)
- Smooth transitions (200ms)

---

## Data Management

### Data Flow Diagram
```
URL: /marketplace/seller/:sellerSlug
       ↓
useParams() → sellerSlug
       ↓
useEffect() → getSellerProfiles({ search: sellerSlug })
       ↓
Find matching seller → resolvedId
       ↓
useEffect() → getSellerProfileById(resolvedId, { products_page: 1 })
       ↓
Update state: seller, products, pagination
       ↓
Render UI
```

### State Management Strategy
- **Local State**: Component-level with `useState()`
- **URL State**: Seller slug via React Router
- **Cart Context**: `useCart()` for cart operations
- **Auth Context**: `useAuth()` for user info

### Caching Strategy
```typescript
// Current approach: Fetch fresh data on component mount
// Consider: Implement cache with cache invalidation

const sellerCache = new Map<number, SellerProfile>();

// Usage:
const getCachedSeller = async (id: number) => {
  if (sellerCache.has(id)) return sellerCache.get(id);
  const data = await getSellerProfileById(id);
  sellerCache.set(id, data);
  return data;
};
```

---

## Error Handling

### Error States

#### 1. Seller Not Found (404)
```
Title: "Seller Not Found"
Message: "This seller profile does not exist."
Action: Back button to previous page
Icon: AlertCircle (red)
```

#### 2. Network Error
```
Title: "Failed to load seller profile"
Message: Error message from API
Action: Retry button
```

#### 3. No Products Available
```
Icon: Package (gray)
Message: "No products currently listed."
Layout: Empty state card
```

#### 4. Product Add to Cart Failed
```
Handled by: CartContext
Fallback: Error toast notification
Recovery: Retry available
```

### Error Recovery
```typescript
try {
  const data = await getSellerProfileById(resolvedId);
  setSeller(data);
} catch (err: any) {
  setError(err.message || 'Failed to load seller profile');
  // UI shows error with back button
}
```

---

## SEO & Accessibility

### Search Engine Optimization

#### Meta Tags
```typescript
<SEOHead
  title={`${displayName} — Seller on Mulya Bazzar`}
  description={`Shop from ${displayName}. ${totalProducts} products available${locationLabel ? ` · Based in ${locationLabel}` : ''}`}
  image={seller.profile_image ?? undefined}
  url={`/marketplace/seller/${sellerSlug}`}
/>
```

#### Structured Data (Schema.org)
```json
{
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "Farm Fresh Nepal",
  "image": "https://cdn.example.com/profile.jpg",
  "url": "https://appmulyabazzar.com/marketplace/seller/farmfresh_store",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Kathmandu",
    "addressRegion": "Central",
    "addressCountry": "NP"
  }
}
```

### Accessibility Features
- **ARIA Labels**: `aria-label` on pagination buttons
- **Semantic HTML**: `<h1>`, `<h2>`, proper heading hierarchy
- **Keyboard Navigation**: Tab through buttons and links
- **Screen Readers**: Alt text on images
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible on interactive elements

### Keyboard Shortcuts
- Tab: Navigate through interactive elements
- Enter: Activate buttons/links
- Escape: Close modals

---

## Performance Optimization

### Current Implementation
- Page size: 20 products (configurable)
- Skeleton loading for better UX
- Memoized callbacks with `useCallback()`
- Conditional rendering for modals

### Recommended Optimizations
```typescript
// Lazy load product images
<img loading="lazy" src={image} />

// Debounce search input
const debouncedSearch = useCallback(
  debounce((term) => searchSellers(term), 300),
  []
);

// Virtualize long product lists
import { FixedSizeList } from 'react-window';
```

---

## Browser Compatibility
- Chrome/Edge: ✅ Latest 2 versions
- Firefox: ✅ Latest 2 versions
- Safari: ✅ Latest 2 versions
- Mobile browsers: ✅ iOS Safari 12+, Android Chrome 90+

---

## Testing Considerations

### Unit Tests
```typescript
// Test slug resolution
test('resolves seller slug to ID', async () => {
  const { getByText } = render(<SellerProfilePage />);
  // Mock params: sellerSlug = 'farmfresh_store'
  // Verify ID resolution
});

// Test pagination
test('updates products on page change', async () => {
  // Click next page button
  // Verify new products loaded
  // Verify scroll to top
});
```

### Integration Tests
- Mock API responses
- Test complete user workflows
- Verify error handling
- Test auth flow (login modal)

### E2E Tests
- Navigate to seller profile
- Add products to cart
- Verify cart updates
- Test pagination
- Test search functionality

---

## Related Documentation
- [Seller Profile API](./SELLER_PROFILE_API.md)
- [Marketplace API](./MARKETPLACE_API.md)
- [Cart Feature](./CART_FEATURES.md)
- [Product Details](./PRODUCT_DETAILS.md)

