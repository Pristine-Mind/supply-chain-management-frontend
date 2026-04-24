# New Year Sale - API Documentation & Mobile App Integration Guide

Complete API reference and implementation guide for the Naya Barsha 2083 New Year Sale feature. This document contains all endpoints, data structures, and implementation examples for mobile app integration.

---

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [Data Structures](#data-structures)
4. [API Endpoints](#api-endpoints)
5. [Usage Examples](#usage-examples)
6. [Client-Side Filtering](#client-side-filtering)
7. [Implementation Checklist](#implementation-checklist)

---

## Base Configuration

### API Base URL
```
https://appmulyabazzar.com/api/v1/new-year-sales/
```

### Environment Setup (for reference)
```javascript
const API_BASE_URL = process.env.VITE_REACT_APP_API_URL || 'https://appmulyabazzar.com';
```

---

## Authentication

All API calls require a **Bearer Token** in the Authorization header.

### Token Storage & Headers

**Mobile Implementation (Example):**
```dart
// Flutter Example
String? token = await storage.read(key: 'auth_token');

final headers = {
  'Authorization': token != null ? 'Token $token' : '',
  'Content-Type': 'application/json',
};
```

**JavaScript/TypeScript Example:**
```typescript
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Token ${token}` } : {};
};
```

**cURL Example:**
```bash
curl -H "Authorization: Token YOUR_TOKEN_HERE" \
  https://appmulyabazzar.com/api/v1/new-year-sales/
```

---

## Data Structures

### 1. NewYearSale Object
Represents a complete sale event with all details.

```typescript
interface NewYearSale {
  id: number;
  name: string;
  description: string;
  discount_percentage: number;          // Overall sale discount (e.g., 50)
  start_date: string;                   // ISO format: "2026-04-14T00:00:00Z"
  end_date: string;                     // ISO format: "2026-05-14T23:59:59Z"
  is_active: boolean;                   // Is sale currently enabled
  sale_status: string;                  // "active", "upcoming", "expired"
  is_sale_active_now: boolean;          // Is sale running right now
  days_remaining: number;               // Days until sale ends
  products: number[];                   // Array of product IDs
  products_detail: any[];               // Full product objects
  product_count: number;                // Total products in sale
  created_at: string;                   // Creation timestamp
  updated_at: string;                   // Last update timestamp
  created_by: number;                   // Creator user ID
  created_by_username: string;          // Creator username
}
```

### 2. NewYearSaleProduct Object
Represents a single product in a sale with pricing.

```typescript
interface NewYearSaleProduct {
  id: number;
  name: string;
  original_price: number;               // Original price before discount (e.g., 1000)
  discounted_price: number;             // Price after discount (e.g., 500)
  discount_amount: number;              // Amount saved (e.g., 500)
  discount_percentage: number;          // Discount % (e.g., 50)
  product_details?: {
    // Nested product details from backend
    id: number;
    name: string;
    description: string;
    sku: string;
    stock: number;
    category: string;
    images: Array<{
      id: number;
      image: string;                    // Image URL
      alt_text: string | null;
    }>;
    average_rating?: number;            // 0-5 rating
    total_reviews?: number;             // Review count
    view_count?: number;                // View count
  };
}
```

**Flattened Product Structure (for mobile use):**
```typescript
interface FlattenedProduct {
  // Core fields
  id: number;
  name: string;
  description: string;
  sku: string;
  
  // Pricing
  price: number;                        // Current/discounted price
  original_price: number;               // Original price
  listed_price: number;                 // Same as original_price
  discounted_price: number;             // Sale price
  discount_percentage: number;          // Discount %
  
  // Media
  images: Array<{
    id: number;
    image: string;
    alt_text: string | null;
  }>;
  
  // Metadata
  stock: number;
  category: string;
  category_details: string;
  average_rating?: number;
  total_reviews?: number;
  view_count?: number;
  
  // Extra
  marketplace_id?: number;
  is_active: boolean;
}
```

### 3. ProductByBrand Object
Products grouped by brand.

```typescript
interface ProductByBrand {
  brand_name: string;
  brand_id: number | null;
  product_count: number;
  products: NewYearSaleProduct[];
}
```

---

## API Endpoints

### Main Endpoint: `/api/v1/new-year-sales/`

All endpoints support **filtering**, **searching**, **pagination**, and **ordering**.

---

### 1. Get All Sales with Filters

**Endpoint:** `GET /api/v1/new-year-sales/`

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `limit` | integer | Results per page (default: 20) | `?limit=10` |
| `offset` | integer | Skip N results | `?offset=20` |
| `search` | string | Search by name, description, product name, brand, category | `?search=electronics` |
| `status` | string | Filter by status: `active`, `upcoming`, `expired` | `?status=active` |
| `discount_min` | number | Minimum discount % | `?discount_min=10` |
| `discount_max` | number | Maximum discount % | `?discount_max=50` |
| `start_date_from` | string | Sales starting from date (ISO: YYYY-MM-DD) | `?start_date_from=2026-04-01` |
| `end_date_to` | string | Sales ending by date (ISO: YYYY-MM-DD) | `?end_date_to=2026-04-30` |
| `is_active` | boolean | Filter by active flag | `?is_active=true` |
| `ordering` | string | Sort field: `start_date`, `-start_date`, `created_at`, `-created_at`, `discount_percentage`, `-discount_percentage`, `end_date`, `-end_date` | `?ordering=-discount_percentage` |

**Response:**
```json
{
  "count": 5,
  "next": "https://appmulyabazzar.com/api/v1/new-year-sales/?offset=20",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Naya Barsha 2083",
      "description": "Grand New Year Sale",
      "discount_percentage": 50,
      "start_date": "2026-04-14T00:00:00Z",
      "end_date": "2026-05-14T23:59:59Z",
      "is_active": true,
      "sale_status": "active",
      "is_sale_active_now": true,
      "days_remaining": 2,
      "products": [1, 2, 3],
      "product_count": 3,
      "created_at": "2026-03-01T10:00:00Z",
      "updated_at": "2026-04-08T15:30:00Z",
      "created_by": 5,
      "created_by_username": "admin"
    }
  ]
}
```

**Example Calls:**

```bash
# Get all active sales
GET https://appmulyabazzar.com/api/v1/new-year-sales/?status=active

# Search for "summer" sales with 20-40% discount
GET https://appmulyabazzar.com/api/v1/new-year-sales/?search=summer&discount_min=20&discount_max=40

# Get upcoming sales ordered by discount (highest first)
GET https://appmulyabazzar.com/api/v1/new-year-sales/?status=upcoming&ordering=-discount_percentage

# Sales in April 2026
GET https://appmulyabazzar.com/api/v1/new-year-sales/?start_date_from=2026-04-01&end_date_to=2026-04-30&limit=50
```

---

### 2. Get Sale by ID

**Endpoint:** `GET /api/v1/new-year-sales/{id}/`

**Response:**
```json
{
  "id": 1,
  "name": "Naya Barsha 2083",
  "description": "Grand New Year Sale with up to 50% discount",
  "discount_percentage": 50,
  "start_date": "2026-04-14T00:00:00Z",
  "end_date": "2026-05-14T23:59:59Z",
  "is_active": true,
  "sale_status": "active",
  "is_sale_active_now": true,
  "days_remaining": 2,
  "products": [1, 2, 3, 4, 5],
  "products_detail": [
    {
      "id": 1,
      "name": "Product 1",
      "original_price": 1000,
      "discounted_price": 500,
      "discount_amount": 500,
      "discount_percentage": 50,
      "product_details": {...}
    }
  ],
  "product_count": 5,
  "created_at": "2026-03-01T10:00:00Z",
  "updated_at": "2026-04-08T15:30:00Z",
  "created_by": 5,
  "created_by_username": "admin"
}
```

---

### 3. Get Discounted Products in Sale

**Endpoint:** `GET /api/v1/new-year-sales/{id}/discounted_products/`

**Description:** Fetch all products in a sale with their discounted pricing. This is the main endpoint to use when fetching products for the sale.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Product A",
    "original_price": 1000,
    "discounted_price": 500,
    "discount_amount": 500,
    "discount_percentage": 50,
    "product_details": {
      "id": 100,
      "name": "Product A",
      "description": "Great product",
      "sku": "PROD-A-001",
      "stock": 50,
      "category": "Electronics",
      "images": [
        {
          "id": 1,
          "image": "https://cdn.example.com/product-a.jpg",
          "alt_text": "Product A Main Image"
        }
      ],
      "average_rating": 4.5,
      "total_reviews": 120,
      "view_count": 5000
    }
  },
  {
    "id": 2,
    "name": "Product B",
    "original_price": 500,
    "discounted_price": 350,
    "discount_amount": 150,
    "discount_percentage": 30,
    "product_details": {...}
  }
]
```

---

### 4. Get Products Grouped by Brand

**Endpoint:** `GET /api/v1/new-year-sales/{id}/products_by_brand/`

**Description:** Get products organized by brand within a sale.

**Response:**
```json
[
  {
    "brand_name": "Brand X",
    "brand_id": 5,
    "product_count": 3,
    "products": [
      {
        "id": 1,
        "name": "Product A",
        "original_price": 1000,
        "discounted_price": 500,
        "discount_amount": 500,
        "discount_percentage": 50,
        "product_details": {...}
      }
    ]
  },
  {
    "brand_name": "Brand Y",
    "brand_id": 6,
    "product_count": 2,
    "products": [...]
  }
]
```

---

### 5. Get Active Sales (Convenience Endpoint)

**Endpoint:** `GET /api/v1/new-year-sales/?status=active`

Returns all sales currently running.

---

### 6. Get Upcoming Sales (Convenience Endpoint)

**Endpoint:** `GET /api/v1/new-year-sales/?status=upcoming`

Returns all sales scheduled for the future.

---

## Usage Examples

### Mobile App Implementation Examples

#### **Example 1: Fetch All Active Sales (Swift/iOS)**

```swift
import Foundation

let url = URL(string: "https://appmulyabazzar.com/api/v1/new-year-sales/?status=active")!
var request = URLRequest(url: url)
request.addValue("Token YOUR_AUTH_TOKEN", forHTTPHeaderField: "Authorization")

URLSession.shared.dataTask(with: request) { data, response, error in
    guard let data = data else { return }
    
    if let decodedResponse = try? JSONDecoder().decode(SalesResponse.self, from: data) {
        let activeSales = decodedResponse.results
        print("Found \(activeSales.count) active sales")
    }
}.resume()
```

#### **Example 2: Fetch Products for a Sale (Kotlin/Android)**

```kotlin
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException

val client = OkHttpClient()
val request = Request.Builder()
    .url("https://appmulyabazzar.com/api/v1/new-year-sales/1/discounted_products/")
    .addHeader("Authorization", "Token YOUR_AUTH_TOKEN")
    .build()

client.newCall(request).enqueue(object : Callback {
    override fun onFailure(call: Call, e: IOException) {
        e.printStackTrace()
    }

    override fun onResponse(call: Call, response: Response) {
        val responseBody = response.body?.string()
        // Parse the JSON products list
        println("Products: $responseBody")
    }
})
```

#### **Example 3: Search Sales with Filters (Python/FastAPI)**

```python
import httpx

async def search_sales():
    async with httpx.AsyncClient() as client:
        url = "https://appmulyabazzar.com/api/v1/new-year-sales/"
        headers = {"Authorization": "Token YOUR_AUTH_TOKEN"}
        
        params = {
            "search": "electronics",
            "discount_min": 20,
            "discount_max": 50,
            "status": "active",
            "ordering": "-discount_percentage"
        }
        
        response = await client.get(url, headers=headers, params=params)
        sales = response.json()
        
        for sale in sales.get("results", []):
            print(f"{sale['name']} - {sale['discount_percentage']}% off")
```

#### **Example 4: Filter Products Client-Side (React/TypeScript)**

```typescript
interface Product {
  id: number;
  name: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  // ... other fields
}

// Fetch products
const response = await fetch(
  `https://appmulyabazzar.com/api/v1/new-year-sales/1/discounted_products/`,
  { headers: { Authorization: `Token ${token}` } }
);
const products: Product[] = await response.json();

// Filter by discount range (20-40%)
const filteredByDiscount = products.filter(p => 
  p.discount_percentage >= 20 && p.discount_percentage <= 40
);

// Search by product name
const searchTerm = "laptop";
const filteredBySearch = products.filter(p =>
  p.name.toLowerCase().includes(searchTerm.toLowerCase())
);

// Combine filters
const combined = products.filter(p =>
  p.discount_percentage >= 20 &&
  p.discount_percentage <= 40 &&
  p.name.toLowerCase().includes(searchTerm.toLowerCase())
);
```

#### **Example 5: Add Product to Cart (Complete Flow)**

```typescript
interface CartProduct {
  id: number;
  name: string;
  price: number;                    // Current/discounted price
  listed_price: number;             // Original price
  quantity: number;
  images: any[];
  // ... other fields
}

async function addProductToCart(product: Product) {
  // Flatten product data for cart
  const cartProduct: CartProduct = {
    id: product.id,
    name: product.name,
    price: product.discounted_price,  // Use discounted price
    listed_price: product.original_price,  // Keep original for display
    quantity: 1,
    images: product.product_details?.images || [],
  };
  
  // Add to cart (your cart API)
  await fetch('/api/cart/add/', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cartProduct)
  });
}
```

---

## Client-Side Filtering

The mobile app should implement **client-side filtering** for better UX and performance.

### Filtering Logic to Implement:

#### 1. **Discount Range Filter**
```typescript
function filterByDiscountRange(
  products: Product[],
  minDiscount: number,
  maxDiscount: number
): Product[] {
  return products.filter(p =>
    p.discount_percentage >= minDiscount &&
    p.discount_percentage <= maxDiscount
  );
}
```

#### 2. **Search Filter (Name & Description)**
```typescript
function searchProducts(
  products: Product[],
  searchTerm: string
): Product[] {
  const term = searchTerm.toLowerCase().trim();
  return products.filter(p =>
    (p.name || '').toLowerCase().includes(term) ||
    (p.product_details?.description || '').toLowerCase().includes(term)
  );
}
```

#### 3. **Combine Multiple Filters**
```typescript
function filterProducts(
  products: Product[],
  filters: {
    discountMin?: number;
    discountMax?: number;
    searchTerm?: string;
  }
): Product[] {
  let filtered = [...products];
  
  // Apply discount range
  if (filters.discountMin !== undefined || filters.discountMax !== undefined) {
    const min = filters.discountMin ?? 0;
    const max = filters.discountMax ?? 100;
    filtered = filterByDiscountRange(filtered, min, max);
  }
  
  // Apply search
  if (filters.searchTerm) {
    filtered = searchProducts(filtered, filters.searchTerm);
  }
  
  return filtered;
}
```

---

## Implementation Checklist

### Backend (Already Done ✓)

- [x] NewYearSale ViewSet with custom actions
- [x] Serializers for sales and products
- [x] Filter backends (search, ordering, discount range)
- [x] Status filtering (active, upcoming, expired)
- [x] API endpoints for products, products_by_brand, discounted_products
- [x] Authentication with Token

### Mobile App To-Do

- [ ] **Data Models**: Create models matching NewYearSale, NewYearSaleProduct, ProductByBrand
- [ ] **API Service**: Create API client class with methods:
  - [ ] `getSales(filters)` - Main endpoint with all filters
  - [ ] `getSaleById(id)` - Get single sale
  - [ ] `getDiscountedProducts(saleId)` - Get products for sale
  - [ ] `getProductsByBrand(saleId)` - Get products grouped by brand
  - [ ] `getActiveSales()` - Convenience method
  - [ ] `getUpcomingSales()` - Convenience method
- [ ] **UI Screens**:
  - [ ] Sales List Screen (with tabs if multiple sales)
  - [ ] Sale Detail Screen (products grid/list)
  - [ ] Product Card Component
  - [ ] Filters Sidebar/Modal
  - [ ] Search Bar with filters
- [ ] **Filtering Logic**:
  - [ ] Discount range filter
  - [ ] Search filter (product name + description)
  - [ ] Combined filtering
- [ ] **Cart Integration**:
  - [ ] Add to cart button on product card
  - [ ] Map discounted_price to cart price
  - [ ] Preserve original_price for display
- [ ] **UI Features**:
  - [ ] Show strikethrough for original price
  - [ ] Display discount percentage badge
  - [ ] Show product images from nested structure
  - [ ] Display product ratings (optional)
- [ ] **Error Handling**:
  - [ ] Network errors
  - [ ] Authentication errors (redirect to login)
  - [ ] Empty state handling
- [ ] **Performance**:
  - [ ] Pagination support (limit, offset)
  - [ ] Image caching
  - [ ] Lazy loading for product grid

---

## Key Implementation Notes

### 1. **Authentication Required**
All endpoints require a valid authentication token. Store token in secure storage and include in all requests.

### 2. **Pricing Fields**
When displaying products, use these fields:
- **Main price (bold)**: `discounted_price`
- **Strikethrough price**: `original_price`
- **Discount %**: `discount_percentage`

### 3. **Image Handling**
Products images are in nested structure via `product_details.images`. Handle nested extraction:
```typescript
const images = product.product_details?.images || [];
```

### 4. **Pagination**
Use `limit` and `offset` for pagination:
```
?limit=20&offset=0    // First page
?limit=20&offset=20   // Second page
?limit=20&offset=40   // Third page
```

### 5. **Search & Filters**
- **Server-side**: Use query parameters (status, discount_min, discount_max, search, ordering)
- **Client-side**: Implement for real-time filtering after fetching

### 6. **Debouncing**
Implement 300-350ms debounce on search input to reduce API calls.

---

## Response Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check query parameters |
| 401 | Unauthorized | Refresh token, redirect to login |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Sale/product doesn't exist |
| 500 | Server Error | Retry after delay |

---

## Support & Questions

For issues or questions:
1. Check API response status codes
2. Verify authentication token
3. Ensure query parameters match expected format
4. Check API base URL is correct

---

**Last Updated:** April 9, 2026  
**API Version:** v1  
**Components:** NayaBarshaBanner, NewYearSale, ProductCard  
**Status:** Production Ready ✓
