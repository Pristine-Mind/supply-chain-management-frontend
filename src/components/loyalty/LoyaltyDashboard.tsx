import React, { useState, useEffect } from 'react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trophy, Gift, TrendingUp, Zap, Heart, Navigation2 } from 'lucide-react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import LoginModal from '../auth/LoginModal';

const LoyaltyDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { userLoyalty, dashboardData, currentPerks, loading, error, refreshLoyalty } = useLoyalty();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
    } else {
      refreshLoyalty();
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
            <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Please sign in to view your loyalty rewards</h1>
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
            <p className="mt-4 text-gray-600">Loading your loyalty profile...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const tier = userLoyalty?.current_tier;
  const nextTier = dashboardData?.tier_progress?.next_tier;
  const progressPercentage = dashboardData?.tier_progress?.progress_percentage || 0;
  const pointsToNextTier = dashboardData?.tier_progress?.points_to_next_tier || 0;

  // Tier colors
  const tierColors = {
    bronze: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', light: 'bg-amber-50' },
    silver: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700', light: 'bg-gray-50' },
    gold: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700', light: 'bg-yellow-50' },
  };

  const tierColor = tierColors[tier?.slug?.toLowerCase() as keyof typeof tierColors] || tierColors.bronze;

  // Perk icons mapping
  const perkIconMap: Record<string, React.ReactNode> = {
    'Priority Support': <Zap className="w-5 h-5" />,
    'Free Shipping': <Navigation2 className="w-5 h-5" />,
    'Exclusive Deals': <Gift className="w-5 h-5" />,
    'Early Access': <Heart className="w-5 h-5" />,
    'Bonus Points': <TrendingUp className="w-5 h-5" />,
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Loyalty Rewards</h1>
            <p className="text-gray-600">Earn points on every purchase and unlock exclusive benefits</p>
          </div>

          {/* Main Tier Card */}
          {tier && (
            <div className={`${tierColor.light} border-2 ${tierColor.border} rounded-2xl p-8 mb-8 shadow-lg`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Tier Badge */}
                <div className="flex flex-col items-center justify-center">
                  <div className={`${tierColor.bg} border-2 ${tierColor.border} rounded-full p-6 mb-4`}>
                    <Trophy className={`w-12 h-12 ${tierColor.text}`} />
                  </div>
                  <h2 className={`text-3xl font-bold ${tierColor.text} text-center`}>{tier.name}</h2>
                  <p className="text-gray-600 text-sm mt-2">Member</p>
                  <div className="mt-3">
                    <span className={`${tierColor.bg} ${tierColor.text} px-3 py-1 rounded-full text-sm font-medium`}>
                      {tier.point_multiplier}x Points
                    </span>
                  </div>
                </div>

                {/* Points Display */}
                <div className="flex flex-col justify-center space-y-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-600 text-sm font-medium mb-1">Spendable Points</p>
                    <p className="text-3xl font-bold text-gray-900">{userLoyalty?.current_points || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-600 text-sm font-medium mb-1">Lifetime Points</p>
                    <p className="text-3xl font-bold text-gray-900">{userLoyalty?.lifetime_points || 0}</p>
                  </div>
                </div>

                {/* Next Tier Progress */}
                {nextTier ? (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <p className="text-gray-600 text-sm font-medium mb-3">Progress to {nextTier.name}</p>
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-orange-400 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">
                      <span className="font-semibold">{pointsToNextTier}</span> points to unlock
                    </p>
                    <button
                      onClick={() => navigate('/marketplace')}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      Shop More
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                      <p className="text-gray-700 font-semibold">You've reached the top tier!</p>
                      <p className="text-sm text-gray-600 mt-1">Enjoy all premium benefits</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Perks Section */}
          {currentPerks.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Current Perks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentPerks.map((perk) => (
                  <div
                    key={perk.id}
                    className="bg-white rounded-lg border-2 border-green-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-green-600 flex-shrink-0">
                        {perkIconMap[perk.name] || <Gift className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{perk.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{perk.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/loyalty/history')}
              className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-amber-300 hover:bg-amber-50 transition-all text-left"
            >
              <h4 className="font-semibold text-gray-900 mb-1">View Transaction History</h4>
              <p className="text-sm text-gray-600">See all your earned and spent points</p>
            </button>
            <button
              onClick={() => navigate('/loyalty/tiers')}
              className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-amber-300 hover:bg-amber-50 transition-all text-left"
            >
              <h4 className="font-semibold text-gray-900 mb-1">Compare All Tiers</h4>
              <p className="text-sm text-gray-600">See what each tier offers</p>
            </button>
          </div>

          {/* Expiring Soon Warning */}
          {userLoyalty?.points_expiring_soon && userLoyalty.points_expiring_soon > 0 && (
            <div className="mt-8 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Zap className="h-5 w-5 text-orange-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-800">
                    <strong>{userLoyalty.points_expiring_soon} points</strong> expiring on{' '}
                    <strong>{userLoyalty.expiry_date_upcoming}</strong>
                  </p>
                  <p className="text-xs text-orange-700 mt-1">Redeem or use them soon to avoid losing them!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoyaltyDashboard;
