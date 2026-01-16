import React, { useState, useEffect } from 'react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { Gift, Zap, TrendingUp } from 'lucide-react';

interface LoyaltyCheckoutProps {
  cartTotal: number;
  onRedemptionChange?: (points: number, discount: number) => void;
}

const LoyaltyCheckoutWidget: React.FC<LoyaltyCheckoutProps> = ({ cartTotal, onRedemptionChange }) => {
  const { userLoyalty, calculatePointsForPurchase } = useLoyalty();
  const [estimatedPoints, setEstimatedPoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [redemptionDiscount, setRedemptionDiscount] = useState(0);
  const [showRedemption, setShowRedemption] = useState(false);

  // Calculate estimated points for this purchase
  useEffect(() => {
    const calculatePoints = async () => {
      if (cartTotal > 0) {
        const points = await calculatePointsForPurchase(cartTotal);
        setEstimatedPoints(points);
      }
    };
    calculatePoints();
  }, [cartTotal, calculatePointsForPurchase]);

  // Handle points redemption
  const handleRedeemPointsChange = (value: number) => {
    const maxRedeemable = userLoyalty?.current_points || 0;
    const validPoints = Math.min(Math.max(value, 0), maxRedeemable);
    setRedeemPoints(validPoints);
    
    // Assume 1 point = 1 unit of currency
    const discount = validPoints;
    setRedemptionDiscount(discount);
    
    if (onRedemptionChange) {
      onRedemptionChange(validPoints, discount);
    }
  };

  const maxRedeemable = userLoyalty?.current_points || 0;
  const tier = userLoyalty?.current_tier;
  const multiplier = tier?.point_multiplier || 1;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Gift className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-gray-900">Loyalty Rewards</h3>
        </div>
        {tier && (
          <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
            {tier.name} • {multiplier}x Points
          </span>
        )}
      </div>

      {/* Points Balance */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-3 border border-amber-100">
          <p className="text-xs text-gray-600 font-medium mb-1">Your Points</p>
          <p className="text-2xl font-bold text-amber-600">{maxRedeemable}</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-green-100">
          <p className="text-xs text-gray-600 font-medium mb-1">You'll Earn</p>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <p className="text-2xl font-bold text-green-600">+{estimatedPoints}</p>
          </div>
        </div>
      </div>

      {/* Redemption Section */}
      {maxRedeemable > 0 && (
        <>
          <button
            onClick={() => setShowRedemption(!showRedemption)}
            className="w-full text-left py-3 px-3 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-between font-medium text-gray-900"
          >
            <span className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Redeem Points</span>
            </span>
            <span className="text-sm text-gray-500">
              {redeemPoints > 0 ? `Save Rs. ${redemptionDiscount}` : 'Optional'}
            </span>
          </button>

          {showRedemption && (
            <div className="bg-white rounded-lg p-4 border border-amber-200 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Points to Redeem</label>
                  <button
                    onClick={() => handleRedeemPointsChange(maxRedeemable)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Use All
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxRedeemable}
                  value={redeemPoints}
                  onChange={(e) => handleRedeemPointsChange(Number(e.target.value))}
                  className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex items-center justify-between mt-2">
                  <input
                    type="number"
                    min="0"
                    max={maxRedeemable}
                    value={redeemPoints}
                    onChange={(e) => handleRedeemPointsChange(Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-600">of {maxRedeemable} available</span>
                </div>
              </div>

              {redeemPoints > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    <span className="font-semibold">{redeemPoints} points</span> will give you{' '}
                    <span className="font-semibold">Rs. {redemptionDiscount} discount</span>
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Redemption Benefits:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ Get instant discount at checkout</li>
                  <li>✓ Plus {multiplier}x points on final amount</li>
                  <li>✓ Points will expire in 365 days if unused</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Box */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">Tip:</span> You're earning <span className="font-semibold text-amber-600">{multiplier}x</span> points on
          every purchase as a {tier?.name} member. Keep shopping to unlock higher tiers!
        </p>
      </div>
    </div>
  );
};

export default LoyaltyCheckoutWidget;
