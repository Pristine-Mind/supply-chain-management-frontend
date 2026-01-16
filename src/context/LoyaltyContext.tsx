import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { loyaltyApi } from '../api/loyaltyApi';
import { useToast } from './ToastContext';
import { UserLoyalty, LoyaltyTier, LoyaltyPerk, LoyaltyDashboardData } from '../types/loyalty';
import { useAuth } from './AuthContext';

interface LoyaltyContextType {
  userLoyalty: UserLoyalty | null;
  allTiers: LoyaltyTier[];
  currentPerks: LoyaltyPerk[];
  dashboardData: LoyaltyDashboardData | null;
  loading: boolean;
  error: string | null;
  refreshLoyalty: () => Promise<void>;
  redeemPoints: (points: number, description: string) => Promise<boolean>;
  calculatePointsForPurchase: (amount: number) => Promise<number>;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [userLoyalty, setUserLoyalty] = useState<UserLoyalty | null>(null);
  const [allTiers, setAllTiers] = useState<LoyaltyTier[]>([]);
  const [currentPerks, setCurrentPerks] = useState<LoyaltyPerk[]>([]);
  const [dashboardData, setDashboardData] = useState<LoyaltyDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch loyalty data
  const fetchLoyaltyData = async () => {
    if (!isAuthenticated) {
      setUserLoyalty(null);
      setCurrentPerks([]);
      setDashboardData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [loyalty, dashboard, tiers] = await Promise.all([
        loyaltyApi.getUserLoyalty(),
        loyaltyApi.getLoyaltyDashboard(),
        loyaltyApi.getAllTiers(),
      ]);

      console.log('Loyalty data loaded:', loyalty);
      setUserLoyalty(loyalty);
      setDashboardData(dashboard);
      setAllTiers(tiers);
      setCurrentPerks(dashboard.current_perks || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load loyalty data';
      setError(errorMessage);
      console.error('Loyalty data error:', err);
      // Set mock data for development if API fails
      const mockLoyalty: UserLoyalty = {
        id: 1,
        user: 1,
        current_tier: {
          id: 2,
          name: 'Silver',
          slug: 'silver',
          min_points: 500,
          point_multiplier: 1.25,
          description: 'Silver tier member'
        },
        current_points: 2500,
        lifetime_points: 5000,
        lifetime_spent: 10000,
        points_expiring_soon: 100,
        next_tier: {
          id: 3,
          name: 'Gold',
          slug: 'gold',
          min_points: 2000,
          point_multiplier: 1.5,
          description: 'Gold tier member'
        },
        points_to_next_tier: 1500,
        tier_upgrade_eligible: false
      };
      setUserLoyalty(mockLoyalty);
      setAllTiers([
        {
          id: 1,
          name: 'Bronze',
          slug: 'bronze',
          min_points: 0,
          point_multiplier: 1,
          description: 'Bronze tier member'
        },
        mockLoyalty.current_tier,
        mockLoyalty.next_tier!
      ]);
      
      // Set mock dashboard data
      const mockDashboard: LoyaltyDashboardData = {
        user_loyalty: mockLoyalty,
        current_perks: [
          {
            id: 1,
            tier: 2,
            name: '25% Bonus Points',
            description: 'Earn an extra 25% points on all purchases',
            icon: 'star'
          },
          {
            id: 2,
            tier: 2,
            name: 'Birthday Bonus',
            description: 'Get 500 bonus points on your birthday',
            icon: 'gift'
          }
        ],
        tier_progress: {
          current_tier: mockLoyalty.current_tier,
          current_points: mockLoyalty.current_points,
          points_to_next_tier: mockLoyalty.points_to_next_tier || 0,
          next_tier: mockLoyalty.next_tier || null,
          progress_percentage: (mockLoyalty.current_points / 2000) * 100
        }
      };
      setDashboardData(mockDashboard);
      setCurrentPerks(mockDashboard.current_perks);
    } finally {
      setLoading(false);
    }
  };

  // Refresh loyalty data
  const refreshLoyalty = async () => {
    await fetchLoyaltyData();
  };

  // Redeem points
  const handleRedeemPoints = async (points: number, description: string): Promise<boolean> => {
    try {
      const result = await loyaltyApi.redeemPoints({ points, description });
      showSuccess('Points Redeemed!', `Successfully redeemed ${points} points. New balance: ${result.new_balance}`);
      await refreshLoyalty();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to redeem points';
      showError('Redemption Failed', errorMessage);
      return false;
    }
  };

  // Calculate points for a purchase
  const handleCalculatePointsForPurchase = async (amount: number): Promise<number> => {
    try {
      const result = await loyaltyApi.calculatePointsForPurchase(amount);
      return result.estimated_points;
    } catch (err) {
      console.error('Error calculating points:', err);
      return 0;
    }
  };

  // Initial load on authentication change
  useEffect(() => {
    fetchLoyaltyData();
  }, [isAuthenticated]);

  const value: LoyaltyContextType = {
    userLoyalty,
    allTiers,
    currentPerks,
    dashboardData,
    loading,
    error,
    refreshLoyalty,
    redeemPoints: handleRedeemPoints,
    calculatePointsForPurchase: handleCalculatePointsForPurchase,
  };

  return (
    <LoyaltyContext.Provider value={value}>
      {children}
    </LoyaltyContext.Provider>
  );
};

export const useLoyalty = (): LoyaltyContextType => {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
};
