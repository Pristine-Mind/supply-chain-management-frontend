# Seller Profile - Quick Reference Guide

## 📋 Quick Links
- **API Documentation**: [SELLER_PROFILE_API.md](./SELLER_PROFILE_API.md)
- **Features Guide**: [SELLER_PROFILE_FEATURES.md](./SELLER_PROFILE_FEATURES.md)
- **Implementation Guide**: [SELLER_PROFILE_IMPLEMENTATION.md](./SELLER_PROFILE_IMPLEMENTATION.md)

---

## 🔗 URL Structure
```
/marketplace/seller/{username}
```

**Example:**
```
https://appmulyabazzar.com/marketplace/seller/farmfresh_store
```

---

## 📌 Key Files
| File | Purpose |
|------|---------|
| `src/components/SellerProfilePage.tsx` | Main component |
| `src/api/marketplaceApi.ts` | API integration (lines 380-540) |
| `src/App.tsx` | Route definition (line 180) |
| `src/components/ProductInstanceView.tsx` | Seller info display on product pages |

---

## 🚀 Quick Start

### Display Seller Profile
```typescript
import SellerProfilePage from './components/SellerProfilePage';

// Already configured in App.tsx
// URL: /marketplace/seller/:sellerSlug
```

### Get Seller Information
```typescript
import { getSellerProfiles, getSellerProfileById } from './api/marketplaceApi';

// List sellers
const allSellers = await getSellerProfiles({ page: 1, page_size: 20 });

// Get single seller with products
const seller = await getSellerProfileById(123, { products_page: 1 });
```

### Add Seller Link
```typescript
import { buildSellerSlug } from './components/SellerProfilePage';

const sellerUrl = `/marketplace/seller/${buildSellerSlug(
  seller.id,
  seller.registered_business_name || seller.first_name,
  seller.username
)}`;
```

---

## 🔌 API Endpoints

### List Sellers
```
GET /api/v1/seller-profiles/
```
**Query Parameters:**
- `search` - Search term
- `business_type` - "distributor" or "retailer"
- `b2b_verified` - true/false
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20)

### Get Single Seller
```
GET /api/v1/seller-profiles/{userId}/
```
**Query Parameters:**
- `products_page` - Products page number (default: 1)
- `products_page_size` - Products per page (default: 50, max: 200)

---

## 📊 Data Types

### SellerProfile
```typescript
interface SellerProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  profile_image: string | null;
  registered_business_name: string | null;
  business_type: string | null;                    // "distributor" | "retailer"
  b2b_verified: boolean;
  shop_id: string | null;
  role: SellerRole | null;
  location: SellerLocation | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  has_access_to_marketplace: boolean;
  total_products: number;
  marketplace_products: SellerMarketplaceProduct[];
  products_pagination?: SellerProductsPagination;
}
```

### SellerMarketplaceProduct
```typescript
interface SellerMarketplaceProduct {
  id: number;
  product: number;
  product_details: { [key: string]: any };
  listed_price: number;
  discounted_price: number | null;
  is_available: boolean;
  variants: any[];
  reviews: any[];
  bulk_price_tiers: any[];
  b2b_price_tiers: any[];
}
```

### SellerProductsPagination
```typescript
interface SellerProductsPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}
```

---

## ✨ Features Checklist

### Display Features
- [x] Seller profile card with image and info
- [x] Business name and type
- [x] B2B verification badge
- [x] Location information
- [x] Product count
- [x] Bio/description

### Product Features
- [x] Product grid (responsive)
- [x] Product images
- [x] Product pricing (with discounts)
- [x] Stock indicators
- [x] Ratings and reviews
- [x] Availability status

### Navigation Features
- [x] Pagination controls
- [x] Page indicator
- [x] Result counter
- [x] Smooth scroll to top
- [x] Back button

### Shopping Features
- [x] Add to cart
- [x] Authentication check
- [x] Stock validation
- [x] Success feedback
- [x] Login modal

### SEO Features
- [x] Dynamic page title
- [x] Meta description
- [x] Structured data (Schema.org)
- [x] OpenGraph tags
- [x] Canonical URL

---

## 🎨 Component States

### Loading
```
Show skeleton placeholders
Animate with pulse effect
```

### Loaded
```
Display seller profile card
Display products grid
Show pagination controls
```

### Error
```
Show error icon
Display error message
Show back button
```

### Empty
```
Show empty state icon
Display "No products" message
```

---

## 🎯 Common Tasks

### 1. Search for Sellers
```typescript
const results = await getSellerProfiles({
  search: 'farm',
  page: 1,
  page_size: 20
});
```

### 2. Filter by Business Type
```typescript
const distributors = await getSellerProfiles({
  business_type: 'distributor'
});
```

### 3. Get B2B Verified Sellers
```typescript
const verified = await getSellerProfiles({
  b2b_verified: true
});
```

### 4. Load Seller Products
```typescript
const seller = await getSellerProfileById(123, {
  products_page: 1,
  products_page_size: 20
});
```

### 5. Handle Pagination
```typescript
const nextPage = await getSellerProfileById(123, {
  products_page: 2,
  products_page_size: 20
});
```

---

## 🔴 Common Issues

| Issue | Solution |
|-------|----------|
| Seller not found | Verify username is correct and seller has products |
| Products not loading | Check pagination state and API response |
| Images not showing | Use placeholder image as fallback |
| Add to cart fails | Verify user is logged in and product is available |
| Page doesn't scroll | Check window.scrollTo() implementation |
| Pagination broken | Verify has_next/has_previous values |

---

## 📈 Performance Optimization

### Current
- Page size: 20-50 products
- Skeleton loading
- Memoized callbacks
- Conditional rendering

### Recommended
- Lazy load images
- Virtualize product lists
- Cache API responses
- Debounce search input
- Preload next page

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Slug resolution
- [ ] Pagination logic
- [ ] Price calculations
- [ ] Stock status display

### Integration Tests
- [ ] Full page load
- [ ] Pagination flow
- [ ] Add to cart flow
- [ ] Auth flow (login modal)

### E2E Tests
- [ ] Navigate to seller
- [ ] Change pages
- [ ] Add products to cart
- [ ] Verify cart updates

---

## 🌐 Browser Support
- ✅ Chrome/Edge (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Mobile browsers (iOS 12+, Android 90+)

---

## 📱 Responsive Breakpoints
```
xs: < 640px    → 2 columns
sm: 640-1024px → 3-4 columns
lg: 1024px+    → 4-5 columns
```

---

## 🔐 Authentication
- Seller profile: Public (no auth required)
- Add to cart: Requires authentication
- Login modal: Shows if user not authenticated

---

## 🎨 Key Colors
| Purpose | Color |
|---------|-------|
| Primary Action | Orange (#F97316) |
| Success | Green (#22C55E) |
| Warning | Yellow (#EAB308) |
| Danger | Red (#EF4444) |
| Info | Blue (#3B82F6) |

---

## 📞 Related Features
- [Product Details](./PRODUCT_DETAILS.md) - Product instance view
- [Shopping Cart](./CART_FEATURES.md) - Cart management
- [User Profile](./USER_PROFILE.md) - User account
- [Marketplace](./MARKETPLACE_API.md) - Product marketplace

---

## 🔗 API Integration Map

```
User visits: /marketplace/seller/username
              ↓
SellerProfilePage component
              ↓
getSellerProfiles({ search: username })  ← Resolve ID
              ↓
getSellerProfileById(id, { products_page: 1 })  ← Load products
              ↓
Display seller info + products grid
              ↓
User actions:
  - Click product → /marketplace/{productId}
  - Click next page → getSellerProfileById(id, { products_page: 2 })
  - Add to cart → CartContext.addToCart()
```

---

## 📚 Documentation Files
1. **API_DOCUMENTATION.md** - API endpoints and parameters
2. **FEATURES.md** - Feature breakdown and workflows
3. **IMPLEMENTATION.md** - How to implement and use
4. **QUICK_REFERENCE.md** - This file (quick lookup)

---

## 🚀 Getting Help

### For API Issues
See: [SELLER_PROFILE_API.md](./SELLER_PROFILE_API.md#troubleshooting)

### For Feature Questions
See: [SELLER_PROFILE_FEATURES.md](./SELLER_PROFILE_FEATURES.md)

### For Implementation Help
See: [SELLER_PROFILE_IMPLEMENTATION.md](./SELLER_PROFILE_IMPLEMENTATION.md#common-tasks)

---

**Last Updated:** May 6, 2026
**Version:** 1.0

