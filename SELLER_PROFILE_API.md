# Seller Profile API Documentation

## Overview
The Seller Profile API provides endpoints to retrieve seller information and their marketplace products. This API supports both listing sellers and viewing individual seller profiles with their products.

---

## Base URL
```
{VITE_REACT_APP_API_URL}/api/v1/
```

---

## Endpoints

### 1. Get Seller Profiles List
**Fetch a paginated list of sellers who have at least one available marketplace product.**

#### Endpoint
```
GET /seller-profiles/
```

#### Method
`GET`

#### Authentication
Not required (public endpoint)

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Search term to filter sellers by username, name, or bio |
| `business_type` | string | No | - | Filter by business type: `'distributor'` or `'retailer'` |
| `b2b_verified` | boolean | No | - | Filter by B2B verification status |
| `page` | integer | No | 1 | Page number for pagination |
| `page_size` | integer | No | 20 | Number of results per page |

#### Request Example
```typescript
// TypeScript
import { getSellerProfiles, type SellerProfileListParams } from '../api/marketplaceApi';

const params: SellerProfileListParams = {
  search: 'farm fresh',
  business_type: 'distributor',
  b2b_verified: true,
  page: 1,
  page_size: 10
};

const response = await getSellerProfiles(params);
```

```bash
# cURL
curl -X GET "https://api.example.com/api/v1/seller-profiles/?search=farm&page=1&page_size=20"
```

#### Response Schema

**Status Code: 200 OK**

```typescript
interface SellerProfileListResponse {
  count: number;                    // Total number of sellers matching filters
  next: string | null;              // URL to next page or null
  previous: string | null;          // URL to previous page or null
  results: SellerProfile[];          // Array of seller profiles
}
```

#### Full Response Example
```json
{
  "count": 45,
  "next": "https://api.example.com/api/v1/seller-profiles/?page=2",
  "previous": null,
  "results": [
    {
      "id": 123,
      "username": "farmfresh_store",
      "first_name": "Ram",
      "last_name": "Pradhan",
      "email": "ram@farmfresh.com",
      "phone_number": "+977-9841234567",
      "profile_image": "https://cdn.example.com/profiles/123.jpg",
      "registered_business_name": "Farm Fresh Nepal",
      "business_type": "distributor",
      "b2b_verified": true,
      "shop_id": "FF-001",
      "role": {
        "id": 1,
        "name": "Seller"
      },
      "location": {
        "id": 5,
        "name": "Kathmandu"
      },
      "bio": "Organic farming products from Nepal",
      "city": "Kathmandu",
      "state": "Central",
      "country": "NP",
      "latitude": 27.7172,
      "longitude": 85.3240,
      "has_access_to_marketplace": true,
      "total_products": 42,
      "marketplace_products": [],
      "products_pagination": null
    }
  ]
}
```

#### Error Responses

**Status Code: 400 Bad Request**
```json
{
  "detail": "Invalid page number"
}
```

**Status Code: 500 Internal Server Error**
```json
{
  "detail": "Internal server error"
}
```

---

### 2. Get Single Seller Profile
**Fetch a single seller's profile with paginated marketplace products.**

#### Endpoint
```
GET /seller-profiles/{userId}/
```

#### Method
`GET`

#### Authentication
Not required (public endpoint)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | integer | Yes | The ID of the seller to retrieve |

#### Query Parameters

| Parameter | Type | Required | Default | Max | Description |
|-----------|------|----------|---------|-----|-------------|
| `products_page` | integer | No | 1 | - | Page number for seller's products |
| `products_page_size` | integer | No | 50 | 200 | Number of products per page |

#### Request Example
```typescript
// TypeScript
import { getSellerProfileById, type GetSellerProfileParams } from '../api/marketplaceApi';

const params: GetSellerProfileParams = {
  products_page: 1,
  products_page_size: 20
};

const sellerProfile = await getSellerProfileById(123, params);
```

```bash
# cURL
curl -X GET "https://api.example.com/api/v1/seller-profiles/123/?products_page=1&products_page_size=20"
```

#### Response Schema

**Status Code: 200 OK**

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
  business_type: string | null;
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

#### Full Response Example
```json
{
  "id": 123,
  "username": "farmfresh_store",
  "first_name": "Ram",
  "last_name": "Pradhan",
  "email": "ram@farmfresh.com",
  "phone_number": "+977-9841234567",
  "profile_image": "https://cdn.example.com/profiles/123.jpg",
  "registered_business_name": "Farm Fresh Nepal",
  "business_type": "distributor",
  "b2b_verified": true,
  "shop_id": "FF-001",
  "role": {
    "id": 1,
    "name": "Seller"
  },
  "location": {
    "id": 5,
    "name": "Kathmandu"
  },
  "bio": "Organic farming products from Nepal",
  "city": "Kathmandu",
  "state": "Central",
  "country": "NP",
  "latitude": 27.7172,
  "longitude": 85.3240,
  "has_access_to_marketplace": true,
  "total_products": 42,
  "marketplace_products": [
    {
      "id": 5001,
      "product": 301,
      "product_details": {
        "id": 301,
        "name": "Organic Tomato - 1kg",
        "category": "Fresh Produce",
        "category_details": "Vegetables > Fresh Vegetables",
        "description": "Fresh organic tomatoes from Nepal",
        "sku": "ORG-TOM-001",
        "price": 85,
        "cost_price": 60,
        "stock": 150,
        "images": [
          {
            "id": 1,
            "image": "https://cdn.example.com/products/301-1.jpg",
            "alt_text": "Fresh organic tomatoes"
          }
        ]
      },
      "listed_price": 120,
      "discounted_price": 99,
      "is_available": true,
      "variants": [],
      "reviews": []
    }
  ],
  "products_pagination": {
    "page": 1,
    "page_size": 20,
    "total": 42,
    "total_pages": 3,
    "has_next": true,
    "has_previous": false
  }
}
```

#### Error Responses

**Status Code: 404 Not Found**
```json
{
  "detail": "Seller not found"
}
```

**Status Code: 400 Bad Request**
```json
{
  "detail": "Invalid page number"
}
```

**Status Code: 500 Internal Server Error**
```json
{
  "detail": "Failed to fetch seller profile"
}
```

---

## Type Definitions

### SellerProfile
```typescript
interface SellerProfile {
  id: number;                           // Unique seller ID
  username: string;                     // Unique username (URL slug)
  first_name: string;                   // Seller's first name
  last_name: string;                    // Seller's last name
  email: string;                        // Email address
  phone_number: string | null;          // Contact phone number
  profile_image: string | null;         // URL to profile picture
  registered_business_name: string | null; // Business name if registered
  business_type: string | null;         // "distributor" or "retailer"
  b2b_verified: boolean;                // B2B verification status
  shop_id: string | null;               // Unique shop identifier
  role: SellerRole | null;              // Seller's role object
  location: SellerLocation | null;      // Location/region object
  bio: string | null;                   // Seller description/bio
  city: string | null;                  // City name
  state: string | null;                 // State/province
  country: string | null;               // Country code (e.g., "NP")
  latitude: number | null;              // Geo latitude
  longitude: number | null;             // Geo longitude
  has_access_to_marketplace: boolean;   // Marketplace access flag
  total_products: number;               // Total products count
  marketplace_products: SellerMarketplaceProduct[]; // Paginated products
  products_pagination?: SellerProductsPagination;   // Pagination metadata
}
```

### SellerMarketplaceProduct
```typescript
interface SellerMarketplaceProduct {
  id: number;                           // Marketplace product ID
  product: number;                      // Internal product ID
  product_details: {                    // Nested product information
    [key: string]: any;
  };
  listed_price: number;                 // Original listing price
  discounted_price: number | null;      // Discounted price (if any)
  is_available: boolean;                // Availability flag
  variants: any[];                      // Size/color variants
  reviews: any[];                       // Product reviews
  bulk_price_tiers: any[];              // Bulk pricing
  b2b_price_tiers: any[];               // B2B pricing
  [key: string]: any;                   // Additional dynamic fields
}
```

### SellerProductsPagination
```typescript
interface SellerProductsPagination {
  page: number;                         // Current page number
  page_size: number;                    // Items per page
  total: number;                        // Total items count
  total_pages: number;                  // Total number of pages
  has_next: boolean;                    // Has next page
  has_previous: boolean;                // Has previous page
}
```

### SellerRole
```typescript
interface SellerRole {
  id: number;                           // Role ID
  name: string;                         // Role name (e.g., "Seller")
}
```

### SellerLocation
```typescript
interface SellerLocation {
  id: number;                           // Location ID
  name: string;                         // Location name
}
```

### SellerProfileListParams
```typescript
interface SellerProfileListParams {
  search?: string;                      // Search query
  business_type?: 'distributor' | 'retailer'; // Filter by type
  b2b_verified?: boolean;               // Filter by B2B verification
  page?: number;                        // Page number
  page_size?: number;                   // Page size
}
```

### GetSellerProfileParams
```typescript
interface GetSellerProfileParams {
  products_page?: number;               // Products page number
  products_page_size?: number;          // Products per page (max 200)
}
```

---

## Rate Limiting
- No specific rate limits documented
- Follows standard API throttling policies

---

## Best Practices

### 1. **Search for Sellers**
Always use the search endpoint with pagination for better performance:
```typescript
const sellers = await getSellerProfiles({
  search: 'farm',
  page: 1,
  page_size: 10
});
```

### 2. **Handle Pagination**
Always check `has_next` and `has_previous` for pagination controls:
```typescript
if (pagination?.has_next) {
  // Load next page
  const nextPage = await getSellerProfileById(sellerId, {
    products_page: currentPage + 1
  });
}
```

### 3. **Cache Profile Data**
Cache seller profiles to avoid repeated requests:
```typescript
const [sellerCache, setSellerCache] = useState<Map<number, SellerProfile>>(new Map());

const loadSeller = async (id: number) => {
  if (sellerCache.has(id)) return sellerCache.get(id);
  const profile = await getSellerProfileById(id);
  sellerCache.set(id, profile);
  return profile;
};
```

### 4. **Error Handling**
Always implement proper error handling:
```typescript
try {
  const seller = await getSellerProfileById(id);
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      // Seller not found
    }
  }
}
```

---

## Related APIs
- [Marketplace API](./MARKETPLACE_API.md)
- [Product API](./PRODUCT_API.md)
- [Review API](./REVIEWS_API.md)

