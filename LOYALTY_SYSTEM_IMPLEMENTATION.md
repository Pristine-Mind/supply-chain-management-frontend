# Loyalty Program System - Implementation Guide

This document provides a comprehensive guide to the Loyalty Program System implemented in the supply chain management frontend application.

## Overview

The Loyalty Program System is a complete customer rewards platform featuring tier-based benefits, point earning mechanisms, and redemption capabilities. It's fully integrated into the checkout flow and user profiles.

## Architecture

### Directory Structure

```
src/
├── api/
│   └── loyaltyApi.ts              # API integration layer
├── components/
│   └── loyalty/
│       ├── LoyaltyDashboard.tsx   # Main loyalty dashboard
│       ├── LoyaltyHistory.tsx      # Transaction history & filtering
│       ├── TierComparison.tsx      # Tier comparison table
│       ├── LoyaltyCheckoutWidget.tsx  # Checkout integration
│       └── ReviewIncentive.tsx     # Review points incentive
├── context/
│   └── LoyaltyContext.tsx          # Global loyalty state management
└── types/
    └── loyalty.ts                  # TypeScript interfaces
```

## Core Components

### 1. **LoyaltyDashboard** (`components/loyalty/LoyaltyDashboard.tsx`)

The main user-facing loyalty dashboard displaying:
- Current tier badge with multiplier
- Points balance (spendable vs. lifetime)
- Progress bar to next tier
- Active perks for current tier
- Points expiring soon warning
- Navigation to history and tier comparison

**Key Features:**
- Tier-specific color coding (Bronze, Silver, Gold)
- Real-time progress calculation
- Expiry warning alerts
- Points to unlock next tier display

**Usage:**
```tsx
<LoyaltyDashboard />
```

### 2. **LoyaltyHistory** (`components/loyalty/LoyaltyHistory.tsx`)

Transaction history with filtering and pagination:
- Earned, spent, and expired points tracking
- Date and description for each transaction
- Expiration date indicators
- Pagination controls (10 items per page)
- Filter by transaction type

**Key Features:**
- Color-coded transaction types
- Icon indicators for quick visual scanning
- Search/filter capabilities
- Responsive pagination

**Usage:**
```tsx
<LoyaltyHistory />
```

### 3. **TierComparison** (`components/loyalty/TierComparison.tsx`)

Detailed tier comparison interface:
- Tier cards with multipliers and requirements
- Feature comparison table
- Current tier highlighting
- CTA buttons for tier progression

**Features:**
- Visual tier progression display
- Feature comparison with check marks
- Locked features for lower tiers
- "Shop More" CTA

**Usage:**
```tsx
<TierComparison />
```

### 4. **LoyaltyCheckoutWidget** (`components/loyalty/LoyaltyCheckoutWidget.tsx`)

Integrated checkout loyalty widget displaying:
- Points earned from purchase
- Points redemption slider
- Tier multiplier information
- Redemption discount calculation

**Key Features:**
- Real-time points calculation
- Slider for point redemption
- Max redemption button
- Discount preview
- Multiplier reminder

**Integration in Checkout:**
```tsx
import LoyaltyCheckoutWidget from './loyalty/LoyaltyCheckoutWidget';

// In CheckoutScreen component
<LoyaltyCheckoutWidget 
  cartTotal={total} 
  onRedemptionChange={(points, discount) => {
    // Handle redemption change
  }}
/>
```

### 5. **ReviewIncentive** (`components/loyalty/ReviewIncentive.tsx`)

Review submission form with point incentives:
- Star rating selector
- Review text area with character count
- Success state after submission
- Configurable point amounts

**Usage:**
```tsx
<ReviewIncentive 
  productName="Product Name"
  productId={123}
  points={5}
  onReviewSubmitted={() => {
    // Handle review submission
  }}
/>
```

## Context & State Management

### LoyaltyContext (`context/LoyaltyContext.tsx`)

Global loyalty state management with the following capabilities:

**State:**
- `userLoyalty`: Current user's loyalty profile
- `allTiers`: All available loyalty tiers
- `currentPerks`: User's current tier perks
- `dashboardData`: Detailed dashboard information
- `loading`: Loading state
- `error`: Error messages

**Methods:**
```tsx
const {
  userLoyalty,        // UserLoyalty object
  allTiers,           // LoyaltyTier[]
  currentPerks,       // LoyaltyPerk[]
  dashboardData,      // LoyaltyDashboardData
  loading,            // boolean
  error,              // string | null
  refreshLoyalty,     // () => Promise<void>
  redeemPoints,       // (points, description) => Promise<boolean>
  calculatePointsForPurchase  // (amount) => Promise<number>
} = useLoyalty();
```

**Usage in Components:**
```tsx
import { useLoyalty } from '../context/LoyaltyContext';

const MyComponent = () => {
  const { userLoyalty, loading, redeemPoints } = useLoyalty();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Current Points: {userLoyalty?.current_points}</p>
    </div>
  );
};
```

## API Integration

### loyaltyApi (`api/loyaltyApi.ts`)

Comprehensive API client for loyalty operations:

```typescript
// Get user's loyalty profile
await loyaltyApi.getUserLoyalty();

// Get detailed dashboard data
await loyaltyApi.getLoyaltyDashboard();

// Get transaction history (paginated, filterable)
await loyaltyApi.getUserTransactions(page, pageSize, filterType);

// Redeem points
await loyaltyApi.redeemPoints({ points, description });

// Get all available tiers
await loyaltyApi.getAllTiers();

// Get specific tier's perks
await loyaltyApi.getTierPerks(tierId);

// Calculate points for purchase amount
await loyaltyApi.calculatePointsForPurchase(amount);
```

## Routes

All loyalty routes are protected (require authentication):

- `/loyalty` - Main loyalty dashboard
- `/loyalty/history` - Transaction history
- `/loyalty/tiers` - Tier comparison

## Integration Examples

### 1. Adding Loyalty to Checkout

```tsx
// In CheckoutScreen component
import { useLoyalty } from '../context/LoyaltyContext';
import LoyaltyCheckoutWidget from './loyalty/LoyaltyCheckoutWidget';

const CheckoutScreen = () => {
  const { total } = useCart();
  const [appliedPoints, setAppliedPoints] = useState(0);
  
  return (
    <>
      {/* Existing checkout code */}
      <LoyaltyCheckoutWidget 
        cartTotal={total}
        onRedemptionChange={(points, discount) => {
          setAppliedPoints(points);
          // Apply discount to total
        }}
      />
      {/* Continue checkout */}
    </>
  );
};
```

### 2. Adding Review Incentives

```tsx
// On product page or reviews section
import ReviewIncentive from './loyalty/ReviewIncentive';

const ProductReview = ({ productId, productName }) => {
  return (
    <div>
      <h3>Customer Reviews</h3>
      <ReviewIncentive 
        productName={productName}
        productId={productId}
        points={5}
        onReviewSubmitted={() => {
          // Refresh reviews or loyalty info
        }}
      />
    </div>
  );
};
```

### 3. Accessing Loyalty Info Anywhere

```tsx
import { useLoyalty } from '../context/LoyaltyContext';

const MyComponent = () => {
  const { userLoyalty, calculatePointsForPurchase } = useLoyalty();
  
  // Display user's current tier
  if (userLoyalty?.current_tier) {
    return <p>Welcome, {userLoyalty.current_tier.name} member!</p>;
  }
};
```

## Data Types

### LoyaltyTier
```typescript
interface LoyaltyTier {
  id: number;
  name: string;
  slug: string;
  min_points: number;
  point_multiplier: number;
  description: string;
}
```

### UserLoyalty
```typescript
interface UserLoyalty {
  id: number;
  user: number;
  current_tier: LoyaltyTier;
  current_points: number;
  lifetime_points: number;
  lifetime_spent: number;
  points_expiring_soon?: number;
  expiry_date_upcoming?: string;
  tier_upgrade_eligible?: boolean;
  next_tier?: LoyaltyTier | null;
  points_to_next_tier?: number;
}
```

### LoyaltyTransaction
```typescript
interface LoyaltyTransaction {
  id: number;
  user: number;
  transaction_type: 'earned' | 'spent' | 'expired' | 'adjusted';
  points: number;
  description: string;
  order_id?: number;
  review_id?: number;
  created_at: string;
  expires_at?: string;
}
```

### LoyaltyPerk
```typescript
interface LoyaltyPerk {
  id: number;
  tier: number;
  name: string;
  description: string;
  icon?: string;
}
```

## Styling & Theming

The loyalty system uses Tailwind CSS with a consistent color scheme:

- **Bronze Tier**: Amber/Orange (`bg-amber-*`, `text-amber-*`)
- **Silver Tier**: Gray (`bg-gray-*`, `text-gray-*`)
- **Gold Tier**: Yellow (`bg-yellow-*`, `text-yellow-*`)

All components are responsive and mobile-optimized using Tailwind's breakpoints.

## Toast Notifications

The system integrates with the ToastContext for user feedback:

```tsx
const { showToast } = useToast();

showToast({
  title: 'Points Redeemed!',
  description: 'Successfully redeemed 100 points',
  variant: 'success'  // 'success', 'error', 'info'
});
```

## Best Practices

### 1. Always Refresh Loyalty Data After Actions
```tsx
const { refreshLoyalty } = useLoyalty();

// After user makes a purchase or submission
await refreshLoyalty();
```

### 2. Handle Loading States
```tsx
const { loading } = useLoyalty();

if (loading) {
  return <LoadingSpinner />;
}
```

### 3. Check Authentication Before Displaying
```tsx
const { isAuthenticated } = useAuth();

if (!isAuthenticated) {
  return <LoginPrompt />;
}
```

### 4. Cache API Responses
The LoyaltyContext automatically caches data and only refetches when authentication changes or refreshLoyalty() is called.

## Backend API Endpoints (Required)

The frontend expects the following API endpoints:

```
GET    /api/v1/loyalty/user/
GET    /api/v1/loyalty/user/summary/
GET    /api/v1/loyalty/user/transactions/
POST   /api/v1/loyalty/user/redeem/
GET    /api/v1/loyalty/tiers/
GET    /api/v1/loyalty/tiers/:id/perks/
GET    /api/v1/loyalty/calculate-points/
```

All endpoints require authentication via JWT token in headers.

## Testing

### Manual Testing Checklist

- [ ] User dashboard displays correct tier and points
- [ ] Progress bar calculates correctly to next tier
- [ ] Redemption slider works and updates discount
- [ ] Transaction history filters by type
- [ ] Pagination works correctly
- [ ] Tier comparison shows all features
- [ ] Review form validates input
- [ ] Toast notifications display
- [ ] Mobile responsiveness on all screens

### Testing Tiers

1. **Bronze**: 0-4,999 points (1x multiplier)
2. **Silver**: 5,000-14,999 points (1.25x multiplier)
3. **Gold**: 15,000+ points (1.5x multiplier)

## Performance Considerations

1. **Data Caching**: LoyaltyContext caches data until `refreshLoyalty()` is called
2. **Lazy Loading**: Components load data on mount, not on initial render
3. **Pagination**: History uses 10-item pages to reduce load
4. **Error Boundaries**: All async operations have error handling

## Future Enhancements

- [ ] Gamification elements (achievements, badges)
- [ ] Referral program integration
- [ ] Partner merchant integration
- [ ] Point expiry scheduling optimization
- [ ] Advanced analytics dashboard
- [ ] Bulk point operations for admin
- [ ] Seasonal point multipliers
- [ ] VIP tier above Gold

## Troubleshooting

### User sees "Please sign in" message
- Ensure user is authenticated in AuthContext
- Check JWT token is valid

### Points not updating
- Call `refreshLoyalty()` after operations
- Check API endpoint is returning data
- Verify user has valid loyalty account

### Tier not changing
- Ensure backend is calculating tier correctly
- Check `points_to_next_tier` calculation
- Verify tier thresholds in backend

### Toast not showing
- Ensure ToastProvider wraps component tree
- Check toast variant is valid
- Verify useToast hook is available

## Support

For issues or questions, refer to:
- Backend Loyalty API documentation
- Component prop interfaces in TypeScript files
- API method signatures in `api/loyaltyApi.ts`
