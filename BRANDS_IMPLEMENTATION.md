# Brands Feature Implementation Documentation

This document outlines the implementation of the Brands feature, which allows users to browse products by specific manufacturers or brands. It includes the data models, API integration, and frontend component logic.

## 1. Overview

The Brands feature provides a dedicated way for users to discover products. It consists of:
1.  A **"Top Brands" carousel** on the main Marketplace page.
2.  A **Brand Details Page** (`/brand-products/:brandId`) that lists all products associated with a specific brand, with filtering and sorting capabilities.

## 2. Data Models

The core data structures are defined in `src/api/brandsApi.ts`.

### Brand Interface
Represents the brand entity itself.
```typescript
export interface Brand {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;       // URL to the brand's logo image
  country_of_origin?: string;
  is_verified?: boolean;   // Verified badge status
  products_count?: number; // Total number of products
}
```

### Brand Product Interface
Represents a product belonging to a brand. It extends the standard product model with brand-specific details and B2B pricing fields.
```typescript
export interface BrandProduct {
  id: number;
  name: string;
  brand_name: string;
  brand_info: BrandProductBrand; // Nested brand details
  
  // Product Details
  price: number;
  stock: number;
  images: BrandProductImage[];
  category_details: string;
  
  // B2B Specific Fields
  is_b2b_eligible?: boolean;
  b2b_price?: number;
  b2b_discounted_price?: number;
  b2b_min_quantity?: number;
  
  // ... other standard product fields (sku, description, etc.)
}
```

## 3. API Integration

The frontend communicates with the backend via `src/api/brandsApi.ts`.

### Endpoints

1.  **Fetch All Brands**
    *   **URL**: `/api/v1/brands/`
    *   **Method**: `GET`
    *   **Usage**: Used in `Marketplace.tsx` to populate the "Top Brands" slider.

2.  **Fetch Brand Details**
    *   **URL**: `/api/v1/brands/:id/`
    *   **Method**: `GET`
    *   **Usage**: Used in `BrandProducts.tsx` to get the header information (name, logo, description) for the brand page.

3.  **Fetch Brand Products**
    *   **URL**: `/api/v1/brands/:id/products/`
    *   **Method**: `GET`
    *   **Params**:
        *   `page`: Pagination control.
        *   `search`: Search query within the brand's products.
        *   `category`: Filter by category ID.
        *   `ordering`: Sort field (e.g., `name`, `-created_at`, `-stock`).
    *   **Usage**: Populates the product grid on the Brand Details page.

## 4. Component Architecture

### Marketplace Entry Point (`Marketplace.tsx`)
*   **Implementation**: Contains a horizontal scrollable list of brands.
*   **Logic**: Fetches brands on mount (`fetchBrands`). Displays brand logos in circular avatars. Clicking a brand navigates to `/brand-products/:id`.

### Brand Details Page (`BrandProducts.tsx`)
*   **Route**: `/brand-products/:brandId`
*   **State Management**:
    *   `brand`: Stores the brand metadata.
    *   `products`: Stores the list of products.
    *   `filters`: Manages search query, category selection, and sort order.
*   **B2B Integration**:
    *   Reuses the **Dual-Pricing Logic** found in the main marketplace.
    *   `getDisplayPrice` function checks `user.b2b_verified` and `product.is_b2b_eligible` to determine if the B2B price or Retail price should be shown.
*   **Cart Integration**:
    *   Uses `useCart` hook to add items.
    *   Passes the calculated price (B2B or Retail) to the cart context to ensure accurate billing.

## 5. Key Features

### Filtering & Sorting
The `BrandProducts` component supports server-side filtering:
*   **Search**: Real-time search within the brand's catalog.
*   **Sorting**: Options include "Name A-Z", "Name Z-A", "Newest First", "Oldest First", and "Stock High to Low".

### Responsive Design
*   **Grid/List View**: Users can toggle between a grid view (cards) and a list view (rows) for products.
*   **Mobile Filters**: On mobile devices, filters are tucked away in a collapsible drawer/modal to save screen space.
