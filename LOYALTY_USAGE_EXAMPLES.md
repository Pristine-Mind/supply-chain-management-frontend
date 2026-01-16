# Loyalty System - Usage Examples

This document provides practical code examples for integrating loyalty features into various parts of the application.

## Table of Contents
1. [Basic Usage](#basic-usage)
2. [Dashboard Integration](#dashboard-integration)
3. [Checkout Integration](#checkout-integration)
4. [Review Integration](#review-integration)
5. [Profile Integration](#profile-integration)
6. [Custom Components](#custom-components)

## Basic Usage

### Accessing Loyalty Context

```tsx
import { useLoyalty } from '../context/LoyaltyContext';

const MyComponent = () => {
  const {
    userLoyalty,
    loading,
    error,
    refreshLoyalty,
    redeemPoints,
    calculatePointsForPurchase
  } = useLoyalty();

  if (loading) return <div>Loading loyalty data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Current Tier: {userLoyalty?.current_tier.name}</p>
      <p>Points: {userLoyalty?.current_points}</p>
    </div>
  );
};
```

### Check User Authentication with Loyalty

```tsx
import { useAuth } from '../context/AuthContext';
import { useLoyalty } from '../context/LoyaltyContext';

const LoyaltyGate = () => {
  const { isAuthenticated } = useAuth();
  const { userLoyalty } = useLoyalty();

  if (!isAuthenticated) {
    return <LoginPrompt message="Sign in to earn loyalty points!" />;
  }

  if (!userLoyalty) {
    return <div>Initializing loyalty account...</div>;
  }

  return <LoyaltyContent />;
};
```

## Dashboard Integration

### Display Loyalty Status in Header

```tsx
import { useLoyalty } from '../context/LoyaltyContext';
import { Gift, TrendingUp } from 'lucide-react';

const LoyaltyHeader = () => {
  const { userLoyalty } = useLoyalty();

  if (!userLoyalty) return null;

  return (
    <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-amber-600" />
        <span className="font-semibold text-gray-900">
          {userLoyalty.current_tier.name} Member
        </span>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <span className="font-semibold text-gray-900">
          {userLoyalty.current_points} Points
        </span>
      </div>
    </div>
  );
};

export default LoyaltyHeader;
```

### Mini Points Display Card

```tsx
import { useLoyalty } from '../context/LoyaltyContext';
import { Badge } from '@/components/ui/badge';

const MiniLoyaltyCard = () => {
  const { userLoyalty, dashboardData } = useLoyalty();

  if (!userLoyalty) return null;

  const progress = dashboardData?.tier_progress;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Your Tier</span>
        <Badge variant="secondary">
          {userLoyalty.current_tier.name}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Points</span>
        <span className="text-lg font-bold text-amber-600">
          {userLoyalty.current_points}
        </span>
      </div>

      {progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Progress to {progress.next_tier?.name}</span>
            <span>{progress.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all"
              style={{ width: `${progress.progress_percentage}%` }}
            />
          </div>
        </div>
      )}

      <button className="w-full text-sm text-amber-600 hover:text-amber-700 font-medium">
        View Full Dashboard →
      </button>
    </div>
  );
};

export default MiniLoyaltyCard;
```

## Checkout Integration

### Complete Checkout with Loyalty

```tsx
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useLoyalty } from '../context/LoyaltyContext';
import { useToast } from '../context/ToastContext';
import LoyaltyCheckoutWidget from './loyalty/LoyaltyCheckoutWidget';

const EnhancedCheckout = () => {
  const { cart, total } = useCart();
  const { calculatePointsForPurchase } = useLoyalty();
  const { showToast } = useToast();
  
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [finalTotal, setFinalTotal] = useState(total);

  const handleRedemptionChange = (points: number, discount: number) => {
    setAppliedPoints(points);
    setFinalTotal(total - discount);
  };

  const handleCheckout = async () => {
    try {
      // Create order with loyalty info
      const orderData = {
        items: cart,
        total: finalTotal,
        loyaltyPointsApplied: appliedPoints,
      };

      // TODO: Submit order
      await submitOrder(orderData);

      showToast({
        title: 'Order Placed!',
        description: `You earned ${calculatePointsForPurchase(finalTotal)} loyalty points!`,
        variant: 'success'
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to place order',
        variant: 'error'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Order items */}
      <OrderItemsList items={cart} />

      {/* Loyalty widget */}
      <LoyaltyCheckoutWidget 
        cartTotal={total}
        onRedemptionChange={handleRedemptionChange}
      />

      {/* Price summary */}
      <div className="border-t pt-4">
        <div className="flex justify-between mb-2">
          <span>Subtotal</span>
          <span>{total}</span>
        </div>
        {appliedPoints > 0 && (
          <div className="flex justify-between mb-2 text-green-600">
            <span>Points Discount</span>
            <span>-{appliedPoints}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{finalTotal}</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold"
      >
        Complete Purchase
      </button>
    </div>
  );
};

export default EnhancedCheckout;
```

### Loyalty Discount Code Display

```tsx
const LoyaltyDiscountBanner = () => {
  const { userLoyalty } = useLoyalty();

  if (!userLoyalty || userLoyalty.current_points < 100) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-4">
      <p className="text-sm text-green-800">
        <strong>Good news!</strong> You have {userLoyalty.current_points} points.
        {userLoyalty.current_points >= 100 && 
          " You can redeem them for discounts at checkout!"}
      </p>
    </div>
  );
};
```

## Review Integration

### Product Review with Loyalty Incentive

```tsx
import ReviewIncentive from './loyalty/ReviewIncentive';
import { useLoyalty } from '../context/LoyaltyContext';

const ProductReviewSection = ({ productId, productName }) => {
  const { refreshLoyalty } = useLoyalty();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-4">Customer Reviews</h3>
        <ReviewsList productId={productId} />
      </div>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl">
        <ReviewIncentive
          productName={productName}
          productId={productId}
          points={5}
          onReviewSubmitted={() => {
            // Refresh user's points after review
            refreshLoyalty();
            
            // Refresh reviews list
            // refreshReviews();
          }}
        />
      </div>
    </div>
  );
};

export default ProductReviewSection;
```

### Batch Review Processing

```tsx
import ReviewIncentive from './loyalty/ReviewIncentive';

const PendingReviewsList = ({ reviews }) => {
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border rounded-lg p-4">
          <h4 className="font-bold mb-2">{review.productName}</h4>
          
          <ReviewIncentive
            productName={review.productName}
            productId={review.productId}
            points={5}
            onReviewSubmitted={() => {
              // Handle review submission
              console.log(`Reviewed: ${review.productName}`);
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default PendingReviewsList;
```

## Profile Integration

### Enhanced User Profile with Loyalty

```tsx
import { useLoyalty } from '../context/LoyaltyContext';
import { useAuth } from '../context/AuthContext';

const EnhancedUserProfile = () => {
  const { user } = useAuth();
  const { userLoyalty, currentPerks } = useLoyalty();

  if (!userLoyalty) return <div>Loading profile...</div>;

  return (
    <div className="space-y-8">
      {/* Basic Info */}
      <section className="border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <p>Name: {user?.name}</p>
        <p>Email: {user?.email}</p>
      </section>

      {/* Loyalty Section */}
      <section className="border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Loyalty Status</h2>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-gray-600">Tier</p>
            <p className="text-2xl font-bold text-amber-700">
              {userLoyalty.current_tier.name}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Current Points</p>
            <p className="text-2xl font-bold text-green-700">
              {userLoyalty.current_points}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Lifetime Points</p>
            <p className="text-2xl font-bold text-blue-700">
              {userLoyalty.lifetime_points}
            </p>
          </div>
        </div>

        {/* Perks */}
        {currentPerks.length > 0 && (
          <div>
            <h3 className="font-bold mb-3">Your Perks</h3>
            <div className="space-y-2">
              {currentPerks.map((perk) => (
                <div key={perk.id} className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="font-semibold text-gray-900">{perk.name}</p>
                  <p className="text-sm text-gray-600">{perk.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Action Links */}
      <section className="flex gap-4">
        <a href="/loyalty/history" className="flex-1 py-3 bg-amber-600 text-white rounded-lg text-center font-bold">
          View Transaction History
        </a>
        <a href="/loyalty/tiers" className="flex-1 py-3 bg-blue-600 text-white rounded-lg text-center font-bold">
          Compare Tiers
        </a>
      </section>
    </div>
  );
};

export default EnhancedUserProfile;
```

## Custom Components

### Loyalty Points Tooltip

```tsx
import { useLoyalty } from '../context/LoyaltyContext';
import { HelpCircle } from 'lucide-react';

const LoyaltyTooltip = () => {
  const { userLoyalty, allTiers } = useLoyalty();
  const [show, setShow] = useState(false);

  if (!userLoyalty) return null;

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-gray-400 hover:text-gray-600"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {show && (
        <div className="absolute bottom-full left-0 mb-2 p-4 bg-white border rounded-lg shadow-lg text-sm whitespace-nowrap">
          <p className="font-bold mb-2">{userLoyalty.current_tier.name} Tier</p>
          <p>Points Multiplier: {userLoyalty.current_tier.point_multiplier}x</p>
          <p className="text-xs text-gray-500 mt-2">
            Next tier at {userLoyalty.next_tier?.min_points} points
          </p>
        </div>
      )}
    </div>
  );
};

export default LoyaltyTooltip;
```

### Tier Upgrade Notification

```tsx
import { useEffect, useState } from 'react';
import { useLoyalty } from '../context/LoyaltyContext';
import { useToast } from '../context/ToastContext';
import { Trophy } from 'lucide-react';

const TierUpgradeNotification = () => {
  const { userLoyalty } = useLoyalty();
  const { showToast } = useToast();
  const [lastTier, setLastTier] = useState(userLoyalty?.current_tier.id);

  useEffect(() => {
    if (userLoyalty && lastTier !== userLoyalty.current_tier.id) {
      showToast({
        title: 'Tier Upgraded! 🎉',
        description: `Welcome to ${userLoyalty.current_tier.name} tier! 
          You now earn ${userLoyalty.current_tier.point_multiplier}x points.`,
        variant: 'success'
      });
      setLastTier(userLoyalty.current_tier.id);
    }
  }, [userLoyalty?.current_tier.id]);

  return null;
};

export default TierUpgradeNotification;
```

### Points Progress Indicator

```tsx
import { useLoyalty } from '../context/LoyaltyContext';
import { TrendingUp } from 'lucide-react';

const PointsProgressIndicator = () => {
  const { dashboardData } = useLoyalty();
  const progress = dashboardData?.tier_progress;

  if (!progress) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-gray-700">
            {progress.current_points} / {progress.current_points + progress.points_to_next_tier}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {progress.progress_percentage}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-gradient-to-r from-amber-400 to-orange-400 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress.progress_percentage, 100)}%` }}
        />
      </div>

      <p className="text-xs text-gray-600">
        {progress.points_to_next_tier} points to {progress.next_tier?.name}
      </p>
    </div>
  );
};

export default PointsProgressIndicator;
```

### Loyalty Action Bar

```tsx
import { useLoyalty } from '../context/LoyaltyContext';
import { useNavigate } from 'react-router-dom';
import { Gift, History, Zap } from 'lucide-react';

const LoyaltyActionBar = () => {
  const { userLoyalty } = useLoyalty();
  const navigate = useNavigate();

  if (!userLoyalty) return null;

  return (
    <div className="flex gap-2 p-3 bg-gray-50 rounded-lg">
      <button
        onClick={() => navigate('/loyalty')}
        className="flex-1 flex items-center gap-2 px-3 py-2 rounded bg-white border hover:bg-gray-50"
      >
        <Gift className="w-4 h-4" />
        <span className="text-sm font-medium">Dashboard</span>
      </button>

      <button
        onClick={() => navigate('/loyalty/history')}
        className="flex-1 flex items-center gap-2 px-3 py-2 rounded bg-white border hover:bg-gray-50"
      >
        <History className="w-4 h-4" />
        <span className="text-sm font-medium">History</span>
      </button>

      <button
        onClick={() => navigate('/loyalty/tiers')}
        className="flex-1 flex items-center gap-2 px-3 py-2 rounded bg-white border hover:bg-gray-50"
      >
        <Zap className="w-4 h-4" />
        <span className="text-sm font-medium">Tiers</span>
      </button>
    </div>
  );
};

export default LoyaltyActionBar;
```

## Advanced Patterns

### Conditional Rendering Based on Points

```tsx
const PointBasedContent = () => {
  const { userLoyalty } = useLoyalty();
  const points = userLoyalty?.current_points || 0;

  return (
    <div className="space-y-4">
      {points >= 1000 && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="font-bold text-purple-900">Premium Member Benefit</p>
          <p className="text-sm text-purple-700">
            Redeem 1000+ points for exclusive items!
          </p>
        </div>
      )}

      {points >= 500 && points < 1000 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-bold text-blue-900">You're Close!</p>
          <p className="text-sm text-blue-700">
            {1000 - points} more points for premium benefits
          </p>
        </div>
      )}

      {points < 500 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="font-bold text-amber-900">Start Earning</p>
          <p className="text-sm text-amber-700">
            Make a purchase to earn your first points!
          </p>
        </div>
      )}
    </div>
  );
};
```

### Loyalty with Authentication

```tsx
const LoyaltyWithAuth = () => {
  const { isAuthenticated } = useAuth();
  const { userLoyalty, loading } = useLoyalty();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in Required',
        description: 'Please sign in to access loyalty rewards',
        variant: 'info'
      });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!userLoyalty) {
    return <CreateLoyaltyAccount />;
  }

  return <LoyaltyContent userLoyalty={userLoyalty} />;
};
```

## Summary

These examples cover common use cases for integrating loyalty features. Adapt them to your specific needs and styling preferences.
