# Loyalty System - Quick Reference Guide

## Quick Start

### For Developers Using Loyalty Features

#### 1. Import Hook
```tsx
import { useLoyalty } from '../context/LoyaltyContext';
```

#### 2. Use in Component
```tsx
const { userLoyalty, calculatePointsForPurchase, redeemPoints } = useLoyalty();
```

#### 3. Display User's Loyalty Info
```tsx
{userLoyalty && (
  <>
    <p>Tier: {userLoyalty.current_tier.name}</p>
    <p>Points: {userLoyalty.current_points}</p>
  </>
)}
```

## Component Quick Reference

### LoyaltyDashboard
**Location**: `/loyalty`  
**Description**: Full loyalty dashboard with tier, points, and perks  
**Props**: None (uses context)  
**Import**: `import LoyaltyDashboard from './loyalty/LoyaltyDashboard';`

### LoyaltyHistory
**Location**: `/loyalty/history`  
**Description**: Transaction history with filtering  
**Props**: None (uses context)  
**Import**: `import LoyaltyHistory from './loyalty/LoyaltyHistory';`

### TierComparison
**Location**: `/loyalty/tiers`  
**Description**: Compare all tiers and their features  
**Props**: None (uses context)  
**Import**: `import TierComparison from './loyalty/TierComparison';`

### LoyaltyCheckoutWidget
**Location**: Use in checkout  
**Description**: Points display and redemption in checkout  
**Props**: 
- `cartTotal: number` - Current cart total
- `onRedemptionChange?: (points, discount) => void` - Callback on points change

```tsx
<LoyaltyCheckoutWidget 
  cartTotal={100}
  onRedemptionChange={(points, discount) => console.log(points, discount)}
/>
```

### ReviewIncentive
**Location**: Use on product/review pages  
**Description**: Review form with point incentives  
**Props**:
- `productName?: string` - Product name for display
- `productId?: number` - Product ID
- `points?: number` - Points to award (default: 5)
- `onReviewSubmitted?: () => void` - Callback after submission

```tsx
<ReviewIncentive 
  productName="Product X"
  productId={123}
  points={5}
  onReviewSubmitted={() => refreshLoyalty()}
/>
```

## Context API

### useLoyalty Hook

```tsx
const {
  // State
  userLoyalty,              // UserLoyalty | null
  allTiers,                 // LoyaltyTier[]
  currentPerks,             // LoyaltyPerk[]
  dashboardData,            // LoyaltyDashboardData | null
  loading,                  // boolean
  error,                    // string | null
  
  // Methods
  refreshLoyalty,           // () => Promise<void>
  redeemPoints,             // (points, desc) => Promise<boolean>
  calculatePointsForPurchase // (amount) => Promise<number>
} = useLoyalty();
```

## Common Tasks

### Display User's Current Tier
```tsx
const { userLoyalty } = useLoyalty();
return <span>{userLoyalty?.current_tier.name} Member</span>;
```

### Show Points Balance
```tsx
const { userLoyalty } = useLoyalty();
return <div>Balance: {userLoyalty?.current_points} points</div>;
```

### Calculate Points for Purchase
```tsx
const { calculatePointsForPurchase } = useLoyalty();

const points = await calculatePointsForPurchase(cartTotal);
console.log(`You'll earn ${points} points`);
```

### Redeem Points
```tsx
const { redeemPoints } = useLoyalty();

const success = await redeemPoints(100, 'Order discount');
if (success) {
  console.log('Points redeemed!');
}
```

### Refresh Loyalty Data
```tsx
const { refreshLoyalty } = useLoyalty();

// After user makes a purchase
await refreshLoyalty();
```

### Display Progress to Next Tier
```tsx
const { dashboardData } = useLoyalty();
const progress = dashboardData?.tier_progress;

return (
  <>
    <p>{progress?.points_to_next_tier} points to {progress?.next_tier?.name}</p>
    <ProgressBar value={progress?.progress_percentage} />
  </>
);
```

## Navigation Links

### User Menu (Navbar)
Add loyalty link to user dropdown:
```tsx
<DropdownItem to="/loyalty" icon={<Gift />} label="Loyalty Rewards" />
```

### Direct Links
- Dashboard: `/loyalty`
- History: `/loyalty/history`
- Tiers: `/loyalty/tiers`

## Colors by Tier

```typescript
const tierColors = {
  bronze: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' },
  silver: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' },
  gold: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
};
```

## Error Handling

### Catch Errors from API
```tsx
try {
  await redeemPoints(points, 'Discount');
} catch (error) {
  console.error('Failed:', error);
  showToast({
    title: 'Error',
    description: error.message,
    variant: 'error'
  });
}
```

### Check Loading State
```tsx
const { loading } = useLoyalty();

if (loading) {
  return <Spinner />;
}
```

## Notifications

### Toast on Success
```tsx
const { showToast } = useToast();

showToast({
  title: 'Success!',
  description: 'Points redeemed',
  variant: 'success'
});
```

### Tier Upgrade Alert
```tsx
showToast({
  title: 'Tier Upgraded!',
  description: 'Welcome to Silver tier!',
  variant: 'success'
});
```

### Points Expiring Soon
```tsx
if (userLoyalty?.points_expiring_soon) {
  showToast({
    title: 'Points Expiring',
    description: `${userLoyalty.points_expiring_soon} points expire soon`,
    variant: 'warning'
  });
}
```

## Type Definitions

### Quick Type Reference
```typescript
// User's loyalty profile
UserLoyalty {
  current_tier: LoyaltyTier
  current_points: number
  lifetime_points: number
  points_expiring_soon?: number
}

// Tier definition
LoyaltyTier {
  name: string           // "Bronze", "Silver", "Gold"
  point_multiplier: number // 1, 1.25, 1.5
  min_points: number     // Points needed to unlock
}

// Transaction
LoyaltyTransaction {
  transaction_type: 'earned' | 'spent' | 'expired'
  points: number
  description: string
  created_at: string
}

// User's perk
LoyaltyPerk {
  name: string          // "Free Shipping", "Priority Support"
  description: string
}
```

## Styling Tips

### Tier Badge
```tsx
<div className={`
  px-3 py-1 rounded-full text-sm font-medium
  ${tier.slug === 'gold' ? 'bg-yellow-100 text-yellow-700' : ''}
  ${tier.slug === 'silver' ? 'bg-gray-100 text-gray-700' : ''}
  ${tier.slug === 'bronze' ? 'bg-amber-100 text-amber-700' : ''}
`}>
  {tier.name}
</div>
```

### Points Display
```tsx
<div className="text-3xl font-bold text-amber-600">
  {userLoyalty?.current_points}
</div>
```

### Progress Bar
```tsx
<div className="w-full bg-gray-200 rounded-full h-3">
  <div 
    className="bg-amber-500 h-3 rounded-full"
    style={{ width: `${progress}%` }}
  />
</div>
```

## Testing Checklist

- [ ] Can view loyalty dashboard
- [ ] Points display correctly
- [ ] Tier shows correct multiplier
- [ ] Can redeem points
- [ ] Transaction history filters work
- [ ] Pagination works
- [ ] Tier comparison displays
- [ ] Review form works
- [ ] Checkout widget appears
- [ ] Mobile view responsive

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Please sign in" appears | User not authenticated. Show login modal |
| Points not updating | Call `refreshLoyalty()` after operations |
| Tier not changing | Check backend tier calculation and thresholds |
| Widget doesn't appear | Wrap parent in `<LoyaltyProvider>` |
| Points 0 across board | Check API endpoint returns data correctly |

## File Structure

```
src/
├── api/loyaltyApi.ts
├── components/loyalty/
│   ├── LoyaltyDashboard.tsx
│   ├── LoyaltyHistory.tsx
│   ├── TierComparison.tsx
│   ├── LoyaltyCheckoutWidget.tsx
│   └── ReviewIncentive.tsx
├── context/LoyaltyContext.tsx
└── types/loyalty.ts
```

## Next Steps

1. Implement backend API endpoints
2. Test all components with real data
3. Add to checkout flow
4. Add to product/review pages
5. Monitor user engagement
6. Gather feedback for improvements
