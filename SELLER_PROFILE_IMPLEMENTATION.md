# Seller Profile Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [API Integration](#api-integration)
4. [Component Usage](#component-usage)
5. [State Management](#state-management)
6. [Common Tasks](#common-tasks)
7. [Troubleshooting](#troubleshooting)
8. [Performance Tips](#performance-tips)

---

## Overview

The Seller Profile feature allows users to:
- View detailed seller information
- Browse all products from a specific seller
- Filter and search seller's products
- Add products to cart
- See seller verification status

**Key Files:**
- `src/components/SellerProfilePage.tsx` - Main component
- `src/api/marketplaceApi.ts` - API functions
- Route: `/marketplace/seller/:sellerSlug`

---

## Getting Started

### 1. Route Configuration
The route is already configured in [App.tsx](src/App.tsx#L180):

```typescript
{ path: '/marketplace/seller/:sellerSlug', element: <SellerProfilePage /> }
```

### 2. URL Structure
Sellers are accessed by their username slug:
```
/marketplace/seller/{username}
Example: /marketplace/seller/farmfresh_store
```

### 3. Building Seller Links
Use the `buildSellerSlug` utility function:

```typescript
import { buildSellerSlug } from './SellerProfilePage';

const sellerUrl = `/marketplace/seller/${buildSellerSlug(
  seller.id,
  seller.registered_business_name || seller.first_name,
  seller.username
)}`;
```

Currently, the function returns just the username:
```typescript
export const buildSellerSlug = (_id: number, _name: string, username: string): string => username;
```

---

## API Integration

### API Functions

#### 1. Get Seller Profiles List
```typescript
import { getSellerProfiles, type SellerProfileListParams } from './api/marketplaceApi';

// Basic usage
const allSellers = await getSellerProfiles();

// With filters
const distributors = await getSellerProfiles({
  business_type: 'distributor',
  b2b_verified: true,
  page: 1,
  page_size: 20
});

// With search
const results = await getSellerProfiles({
  search: 'farm',
  page: 1
});
```

#### 2. Get Single Seller Profile
```typescript
import { getSellerProfileById, type GetSellerProfileParams } from './api/marketplaceApi';

// Basic usage
const seller = await getSellerProfileById(123);

// With pagination
const seller = await getSellerProfileById(123, {
  products_page: 2,
  products_page_size: 50
});
```

### Error Handling Pattern

```typescript
import axios from 'axios';

try {
  const seller = await getSellerProfileById(sellerId);
  setSeller(seller);
} catch (error: any) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      setError('Seller not found');
    } else {
      setError(error.response?.data?.detail || 'Failed to load seller');
    }
  } else {
    setError('Network error');
  }
}
```

---

## Component Usage

### Basic Implementation

```typescript
import React from 'react';
import SellerProfilePage from './components/SellerProfilePage';

// In your route configuration:
const routes = [
  {
    path: '/marketplace/seller/:sellerSlug',
    element: <SellerProfilePage />
  }
];
```

### Accessing Seller Data Within Component

```typescript
const { sellerSlug } = useParams<{ sellerSlug: string }>();
const navigate = useNavigate();
const { addToCart } = useCart();
const { user } = useAuth();

// Component handles:
// - Resolving seller slug to ID
// - Loading seller profile
// - Managing product pagination
// - Adding products to cart
```

### Integration with ProductInstanceView

The `ProductInstanceView` component can display seller information:

```typescript
import { getSellerProfileById, type SellerProfile } from '../api/marketplaceApi';

const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
const [sellerLoading, setSellerLoading] = useState(false);

useEffect(() => {
  setSellerLoading(true);
  getSellerProfileById(sellerId)
    .then(setSellerProfile)
    .catch(() => setSellerProfile(null))
    .finally(() => setSellerLoading(false));
}, [sellerId]);
```

---

## State Management

### Component State Pattern

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

### State Transitions

```
Initial Load:
loading: true → Fetch seller data → loading: false, seller: data

Page Change:
currentPage: 1 → Fetch products → currentPage: 2, products: data

Error State:
error: null → API fails → error: "Failed to load"

Cart Add:
addedIds: Set() → Click add → addedIds: Set(5001) → Timer → addedIds: Set()
```

---

## Common Tasks

### Task 1: Fetch and Display Seller Data

```typescript
const fetchSeller = async (username: string) => {
  setLoading(true);
  try {
    // Step 1: Resolve username to ID
    const response = await getSellerProfiles({
      search: username,
      page_size: 10
    });
    
    const match = response.results.find(s => s.username === username);
    if (!match) throw new Error('Seller not found');
    
    // Step 2: Fetch full profile with products
    const seller = await getSellerProfileById(match.id, {
      products_page: 1,
      products_page_size: 20
    });
    
    setSeller(seller);
    setProducts(seller.marketplace_products);
    setPagination(seller.products_pagination ?? null);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### Task 2: Handle Pagination

```typescript
const handlePageChange = async (page: number) => {
  if (!resolvedId) return;
  
  setProductsLoading(true);
  try {
    const data = await getSellerProfileById(resolvedId, {
      products_page: page,
      products_page_size: 20
    });
    
    setProducts(data.marketplace_products);
    setPagination(data.products_pagination ?? null);
    setCurrentPage(page);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    setError('Failed to load products');
  } finally {
    setProductsLoading(false);
  }
};
```

### Task 3: Add Product to Cart

```typescript
const handleAddToCart = async (product: SellerMarketplaceProduct) => {
  // Check authentication
  if (!user) {
    setIsLoginModalOpen(true);
    return;
  }
  
  try {
    // Add to cart via context
    await addToCart(product as any, 1);
    
    // Show success feedback
    setAddedIds(prev => new Set(prev).add(product.id));
    
    // Clear after 2 seconds
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  } catch (error) {
    // CartContext handles error display
    console.error('Failed to add to cart:', error);
  }
};
```

### Task 4: Handle Loading States

```typescript
// Initial page load
if (loading) {
  return (
    <div className="animate-pulse">
      {/* Skeleton loaders */}
      <div className="h-40 bg-gray-200 rounded" />
      <div className="grid gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}

// Products loading (page change)
if (productsLoading) {
  return (
    <div className="grid gap-4 animate-pulse">
      {/* Mini skeletons */}
    </div>
  );
}
```

### Task 5: Display Seller Information

```typescript
const displayName =
  seller.registered_business_name ||
  `${seller.first_name} ${seller.last_name}`.trim() ||
  seller.username;

const locationLabel = [seller.city, seller.state, seller.country]
  .filter(Boolean)
  .join(', ');

return (
  <div className="bg-white rounded-xl border p-6">
    <div className="flex gap-5">
      {/* Seller Image */}
      {seller.profile_image ? (
        <img
          src={seller.profile_image}
          alt={displayName}
          className="w-20 h-20 rounded-full"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
          <User className="w-10 h-10 text-orange-400" />
        </div>
      )}
      
      {/* Seller Info */}
      <div className="flex-1">
        <h1 className="text-xl font-bold">{displayName}</h1>
        
        {/* Badges */}
        {seller.b2b_verified && (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            <BadgeCheck className="w-3.5 h-3.5" />
            B2B Verified
          </span>
        )}
        
        {/* Location */}
        {locationLabel && (
          <p className="text-sm text-gray-600">
            <MapPin className="inline w-4 h-4" />
            {locationLabel}
          </p>
        )}
      </div>
    </div>
  </div>
);
```

### Task 6: Render Product Grid

```typescript
const PLACEHOLDER_IMG = 'https://via.placeholder.com/300x300?text=No+Image';

return (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {products.map((product) => {
      const details = product.product_details as any;
      const mainImage = details?.images?.[0]?.image || PLACEHOLDER_IMG;
      const productName = details?.name || 'Unnamed Product';
      const stock = details?.stock ?? 0;
      
      return (
        <div key={product.id} className="bg-white rounded-lg border overflow-hidden">
          {/* Image */}
          <a href={`/marketplace/${product.id}`} className="block h-44 bg-gray-50 overflow-hidden">
            <img
              src={mainImage}
              alt={productName}
              className="w-full h-full object-contain p-2"
              onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
            />
          </a>
          
          {/* Product Info */}
          <div className="p-3">
            <a href={`/marketplace/${product.id}`} className="font-semibold line-clamp-2">
              {productName}
            </a>
            
            {/* Price */}
            <div className="text-sm font-bold text-orange-600 mt-2">
              Rs. {product.discounted_price || product.listed_price}
            </div>
            
            {/* Stock */}
            <div className="flex items-center gap-1 text-xs mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              {stock > 0 ? `${stock} in stock` : 'Out of stock'}
            </div>
            
            {/* Add to Cart */}
            <button
              onClick={() => handleAddToCart(product)}
              disabled={!product.is_available || stock === 0}
              className="w-full mt-2 py-1.5 bg-orange-600 text-white text-xs font-medium rounded"
            >
              Add to Cart
            </button>
          </div>
        </div>
      );
    })}
  </div>
);
```

### Task 7: Implement Pagination Controls

```typescript
const totalPages = pagination?.total_pages ?? 1;

return (
  <div className="flex items-center justify-center gap-2 mt-8">
    {/* Previous Button */}
    <button
      onClick={() => handlePageChange(currentPage - 1)}
      disabled={!pagination?.has_previous}
      className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>

    {/* Page Numbers */}
    {Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
      .map((page) => (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium ${
            page === currentPage
              ? 'bg-orange-600 text-white'
              : 'border text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}

    {/* Next Button */}
    <button
      onClick={() => handlePageChange(currentPage + 1)}
      disabled={!pagination?.has_next}
      className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
    >
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);
```

---

## Troubleshooting

### Issue: Seller Not Found
**Symptoms:** Error page shows "Seller not found"

**Solutions:**
1. Verify the username slug is correct
2. Check if seller has marketplace access
3. Confirm seller has at least one product

```typescript
// Debug: Log the slug resolution
console.log('Slug:', sellerSlug);
console.log('Resolved ID:', resolvedId);
console.log('Seller:', seller);
```

### Issue: Products Not Loading
**Symptoms:** Empty products grid

**Solutions:**
1. Check pagination state
2. Verify page number is valid
3. Check for API errors

```typescript
console.log('Current Page:', currentPage);
console.log('Total Pages:', pagination?.total_pages);
console.log('Has Next:', pagination?.has_next);
```

### Issue: Add to Cart Not Working
**Symptoms:** Button doesn't respond

**Solutions:**
1. Verify user is logged in
2. Check product availability
3. Check stock status
4. Check CartContext implementation

```typescript
console.log('User:', user);
console.log('Product Available:', product.is_available);
console.log('Stock:', product.product_details?.stock);
```

### Issue: Images Not Loading
**Symptoms:** Placeholder images shown

**Solutions:**
1. Verify image URLs are correct
2. Check CORS headers
3. Verify CDN is accessible

```typescript
// Check image URL
console.log('Image URL:', mainImage);

// Add error handler
onError={(e) => {
  console.error('Image failed:', e.currentTarget.src);
  e.currentTarget.src = PLACEHOLDER_IMG;
}}
```

### Issue: Pagination Not Working
**Symptoms:** Page buttons don't change products

**Solutions:**
1. Check pagination state updates
2. Verify resolvedId is set
3. Check network requests

```typescript
console.log('Pagination:', pagination);
console.log('Has Next:', pagination?.has_next);
console.log('Has Previous:', pagination?.has_previous);
```

---

## Performance Tips

### 1. Optimize Images
```typescript
// Add loading="lazy" for lazy loading
<img
  src={mainImage}
  alt={productName}
  loading="lazy"
  className="w-full h-full object-contain"
/>

// Use responsive images
<picture>
  <source media="(max-width: 640px)" srcSet={smallImg} />
  <source media="(max-width: 1024px)" srcSet={mediumImg} />
  <img src={largeImg} alt={productName} />
</picture>
```

### 2. Memoize Components
```typescript
// Memoize product card
const ProductCard = React.memo(({ product, onAddToCart }) => (
  // Card JSX
));

// Memoize callbacks
const handlePageChange = useCallback((page: number) => {
  fetchPage(page);
}, [resolvedId]);
```

### 3. Virtualize Long Lists
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={products.length}
  itemSize={250}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ProductCard product={products[index]} />
    </div>
  )}
</FixedSizeList>
```

### 4. Cache API Responses
```typescript
const sellerCache = new Map<number, SellerProfile>();

const getCachedSeller = async (id: number) => {
  if (sellerCache.has(id)) return sellerCache.get(id)!;
  
  const seller = await getSellerProfileById(id);
  sellerCache.set(id, seller);
  return seller;
};
```

### 5. Debounce Search
```typescript
import { debounce } from 'lodash';

const debouncedSearch = useCallback(
  debounce(async (term: string) => {
    const results = await getSellerProfiles({
      search: term,
      page_size: 10
    });
    setSearchResults(results.results);
  }, 300),
  []
);
```

### 6. Preload Next Page
```typescript
const preloadNextPage = async () => {
  if (pagination?.has_next) {
    await getSellerProfileById(resolvedId, {
      products_page: currentPage + 1,
      products_page_size: PAGE_SIZE
    });
  }
};
```

---

## Related Files
- [src/components/SellerProfilePage.tsx](../src/components/SellerProfilePage.tsx) - Main component
- [src/api/marketplaceApi.ts](../src/api/marketplaceApi.ts#L462) - API functions
- [src/context/CartContext.tsx](../src/context/CartContext.tsx) - Cart management
- [src/context/AuthContext.tsx](../src/context/AuthContext.tsx) - Auth management
- [src/components/ProductInstanceView.tsx](../src/components/ProductInstanceView.tsx#L39) - Product integration

