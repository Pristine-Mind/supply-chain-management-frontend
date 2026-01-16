import React, { useState, useEffect } from 'react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import LoginModal from '../auth/LoginModal';

const TierComparison: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { userLoyalty, allTiers, loading, error } = useLoyalty();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4 pt-20">
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onSuccess={() => {
              setShowLoginModal(false);
              window.location.reload();
            }}
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Please sign in to view tier comparison</h1>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4 pt-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            <p className="mt-4 text-gray-600">Loading tier information...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Features for comparison
  const features = [
    { name: 'Point Multiplier', key: 'multiplier' },
    { name: 'Minimum Points Required', key: 'min_points' },
    { name: 'Priority Support', key: 'priority_support' },
    { name: 'Free Shipping', key: 'free_shipping' },
    { name: 'Exclusive Deals', key: 'exclusive_deals' },
    { name: 'Birthday Bonus', key: 'birthday_bonus' },
    { name: 'Early Access', key: 'early_access' },
    { name: 'Bonus Point Events', key: 'bonus_events' },
  ];

  // Feature data for each tier
  const tierFeatures: Record<string, Record<string, boolean | string>> = {
    bronze: {
      multiplier: '1x',
      min_points: '0',
      priority_support: false,
      free_shipping: false,
      exclusive_deals: false,
      birthday_bonus: false,
      early_access: false,
      bonus_events: false,
    },
    silver: {
      multiplier: '1.25x',
      min_points: '5000',
      priority_support: true,
      free_shipping: true,
      exclusive_deals: true,
      birthday_bonus: true,
      early_access: false,
      bonus_events: true,
    },
    gold: {
      multiplier: '1.5x',
      min_points: '15000',
      priority_support: true,
      free_shipping: true,
      exclusive_deals: true,
      birthday_bonus: true,
      early_access: true,
      bonus_events: true,
    },
  };

  const getCurrentTierSlug = () => {
    return userLoyalty?.current_tier?.slug?.toLowerCase() || 'bronze';
  };

  const tierColors = {
    bronze: { bg: 'bg-amber-100', border: 'border-amber-300', badge: 'bg-amber-500', text: 'text-amber-700' },
    silver: { bg: 'bg-gray-100', border: 'border-gray-300', badge: 'bg-gray-400', text: 'text-gray-700' },
    gold: { bg: 'bg-yellow-100', border: 'border-yellow-400', badge: 'bg-yellow-500', text: 'text-yellow-700' },
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Loyalty Tier Comparison</h1>
            <p className="text-gray-600 text-lg">
              Compare features across our three membership tiers and find your perfect fit
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Tier Cards - Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {Array.isArray(allTiers) && allTiers.map((tier) => {
              const tierSlug = tier.slug.toLowerCase();
              const colors = tierColors[tierSlug as keyof typeof tierColors] || tierColors.bronze;
              const isCurrentTier = tierSlug === getCurrentTierSlug();

              return (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl border-2 ${colors.border} p-6 ${
                    isCurrentTier
                      ? `${colors.bg} ring-2 ring-offset-2 ${colors.border}`
                      : 'bg-white'
                  }`}
                >
                  {isCurrentTier && (
                    <div className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/2">
                      <div className={`${colors.badge} text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center`}>
                        <Check className="w-4 h-4 mr-1" />
                        Current Tier
                      </div>
                    </div>
                  )}

                  <h3 className={`text-2xl font-bold ${colors.text} mb-2`}>{tier.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{tier.description}</p>

                  <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                    <p className="text-gray-600 text-sm font-medium mb-1">Points Multiplier</p>
                    <p className={`text-3xl font-bold ${colors.text}`}>{tier.point_multiplier}x</p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-600 text-sm font-medium mb-1">Min. Points to Unlock</p>
                    <p className="text-xl font-semibold text-gray-900">{tier.min_points.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Comparison Table */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    {Array.isArray(allTiers) && allTiers.map((tier) => (
                      <th
                        key={tier.id}
                        className="px-6 py-4 text-center text-sm font-semibold text-gray-900 bg-amber-50"
                      >
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr
                      key={feature.key}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-amber-50 transition-colors`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {feature.name}
                      </td>
                      {Array.isArray(allTiers) && allTiers.map((tier) => {
                        const tierSlug = tier.slug.toLowerCase();
                        const featureValue = tierFeatures[tierSlug]?.[feature.key];
                        const isBoolean = typeof featureValue === 'boolean';

                        return (
                          <td
                            key={`${tier.id}-${feature.key}`}
                            className="px-6 py-4 text-center"
                          >
                            {isBoolean ? (
                              featureValue ? (
                                <div className="flex justify-center">
                                  <div className="bg-green-100 text-green-700 rounded-full p-1">
                                    <Check className="w-5 h-5" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <div className="bg-gray-100 text-gray-400 rounded-full p-1">
                                    <Lock className="w-5 h-5" />
                                  </div>
                                </div>
                              )
                            ) : (
                              <span className="text-sm font-semibold text-gray-900">
                                {featureValue}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-8 text-center text-white">
            <h3 className="text-3xl font-bold mb-3">Ready to Earn More Rewards?</h3>
            <p className="text-lg mb-6 opacity-90">
              {userLoyalty?.current_tier?.slug?.toLowerCase() !== 'gold'
                ? 'Shop more to reach the next tier and unlock premium benefits!'
                : 'You have already reached the top tier! Enjoy all premium benefits.'}
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              className="bg-white text-amber-600 hover:text-orange-600 font-semibold py-3 px-8 rounded-lg transition-all hover:shadow-lg"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TierComparison;
