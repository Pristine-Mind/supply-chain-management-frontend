# B2B Feature Implementation Documentation

This document outlines how the Business-to-Business (B2B) features are implemented in the frontend application. The system allows verified B2B users to access special pricing and bulk ordering capabilities.

## 1. Overview

The B2B system operates on a dual-pricing model where products can have both a retail price and a B2B price. The application dynamically determines which price to show based on the user's verification status and the product's eligibility.

## 2. Data Models

### User Model (`AuthContext.tsx`)
The `User` interface includes a specific flag to identify B2B customers:
```typescript
interface User {
  // ... other fields
  b2b_verified?: boolean; // Determines if the user has access to B2B pricing
}
```

### Product Model (`types/index.ts` or Component Interfaces)
Products contain specific fields for B2B logic:
```typescript
interface MarketplaceProductInstance {
  // ... other fields
  is_b2b_eligible?: boolean;   // Is this product available for B2B?
  b2b_price?: number;          // The special price for B2B users
  b2b_min_quantity?: number;   // Minimum order quantity for B2B pricing
  bulk_price_tiers: BulkPriceTier[]; // Array of volume discounts
}
```

## 3. Core Logic: Price Determination

The central logic for determining which price to display is encapsulated in the `getDisplayPrice` helper function (found in `ProductInstanceView.tsx` and `Marketplace.tsx`).

### Logic Flow:
1.  **Check User Status**: Is `user.b2b_verified` true?
2.  **Check Product Eligibility**: Is `product.is_b2b_eligible` true?
3.  **Check Price Existence**: Is `product.b2b_price` a valid number?

If **all** conditions are met, the system displays the **B2B Price**. Otherwise, it falls back to the **Discounted Price** (if an offer is active) or the **Listed Price**.

```typescript
const getDisplayPrice = () => {
  const isB2BVerified = user?.b2b_verified || false;
  const isB2BEligible = product.is_b2b_eligible || false;
  const hasB2BPrice = typeof product.b2b_price === 'number';
  
  if (isB2BVerified && isB2BEligible && hasB2BPrice) {
    return {
      price: product.b2b_price,
      isB2BPrice: true,
      minQuantity: product.b2b_min_quantity || 1
    };
  }
  
  // Fallback to Retail Logic...
};
```

## 4. Component Implementation

### Product Details (`ProductInstanceView.tsx`)
*   **Price Display**: Uses `getDisplayPrice` to show the correct price. If B2B, it adds a "B2B Price" badge.
*   **Quantity Enforcement**: The quantity selector respects `b2b_min_quantity`.
    *   *Initial State*: Sets initial quantity to `b2b_min_quantity` if eligible.
    *   *Validation*: Prevents decrementing below the minimum.
*   **Add to Cart**: When adding to the cart, the component calculates the price *at that moment* and passes the specific `discounted_price` and `listed_price` to the cart context. This ensures the cart reflects the B2B price the user saw.

### Marketplace Listing (`Marketplace.tsx`)
*   Similar to the product page, the listing view uses the same logic to display the "starting at" price or the specific B2B price card.

## 5. Cart & Checkout (`CartContext.tsx`)

The Cart Context is responsible for holding the items. It relies on the components to pass the correctly calculated price during the `addToCart` action.

*   **Data Persistence**: The cart item stores `is_b2b_eligible`, `b2b_price`, and `b2b_min_quantity` to maintain context.
*   **Calculations**: Total savings and subtotal are calculated based on the price passed during the add-to-cart event (which would be the B2B price for verified users).

## 6. Bulk Pricing

In addition to the base B2B price, products can have `bulk_price_tiers`.
*   These are displayed in `ProductInstanceView.tsx`.
*   They show `min_quantity`, `discount_percent`, and `price_per_unit`.
*   *Note: The current implementation displays these tiers, but the dynamic price adjustment based on quantity selection (beyond the base B2B price) is handled by the backend or specific cart logic.*

## 7. API Integration

The B2B functionality relies on specific API endpoints to deliver the necessary data.

### Marketplace Products
*   **Endpoint**: `GET /api/v1/marketplace/`
*   **Usage**: Fetches the list of products. The response includes B2B-specific fields for each product object, allowing the frontend to render the correct price immediately.
*   **Key Fields**: `is_b2b_eligible`, `b2b_price`, `b2b_min_quantity`, `bulk_price_tiers`.

### Marketplace Search
*   **Endpoint**: `GET /api/v1/marketplace/search/`
*   **Usage**: Similar to the main marketplace endpoint, search results include the full set of B2B fields to ensure consistent pricing display during search.

### User Profile
*   **Endpoint**: `GET /api/v1/user-profile/` (or Login Response)
*   **Usage**: Provides the user's verification status.
*   **Key Field**: `b2b_verified` (boolean). This flag is stored in the `AuthContext` and is the primary switch for enabling B2B features for a session.

### Cart Management
*   **Endpoint**: `GET /api/v1/my-cart/`
*   **Usage**: Retrieves the user's current cart. The backend persists the B2B context of added items.
*   **Response Handling**: The `CartContext` maps the response to include `b2b_price` and `b2b_min_quantity`, ensuring that the cart summary and checkout process respect the special pricing rules.

