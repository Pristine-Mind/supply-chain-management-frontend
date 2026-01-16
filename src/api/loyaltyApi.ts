import axios from 'axios';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

// Types
export interface LoyaltyTier {
  id: number;
  name: string;
  slug: string;
  min_points: number;
  point_multiplier: number;
  description: string;
}

export interface LoyaltyPerk {
  id: number;
  tier: number;
  name: string;
  description: string;
  icon?: string;
}

export interface UserLoyalty {
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

export interface LoyaltyTransaction {
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

export interface RedemptionRequest {
  points: number;
  description: string;
}

export interface LoyaltyDashboardData {
  user_loyalty: UserLoyalty;
  current_perks: LoyaltyPerk[];
  tier_progress: {
    current_tier: LoyaltyTier;
    current_points: number;
    points_to_next_tier: number;
    next_tier: LoyaltyTier | null;
    progress_percentage: number;
  };
}

// API Calls
export const loyaltyApi = {
  // Get current user's loyalty profile
  getUserLoyalty: async (): Promise<UserLoyalty> => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/loyalty/user/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user loyalty:', error);
      throw error;
    }
  },

  // Get detailed dashboard data
  getLoyaltyDashboard: async (): Promise<LoyaltyDashboardData> => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/loyalty/user/summary/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty dashboard:', error);
      throw error;
    }
  },

  // Get user's transaction history (paginated)
  getUserTransactions: async (
    page: number = 1,
    pageSize: number = 10,
    filterType?: 'earned' | 'spent' | 'expired'
  ): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: LoyaltyTransaction[];
  }> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      if (filterType) {
        params.append('type', filterType);
      }

      const response = await axios.get(
        `${API_URL}/api/v1/loyalty/user/transactions/?${params}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  // Redeem points
  redeemPoints: async (data: RedemptionRequest): Promise<{
    message: string;
    new_balance: number;
    redemption_id: string;
  }> => {
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/loyalty/user/redeem/`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  },

  // Get all available tiers
  getAllTiers: async (): Promise<LoyaltyTier[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/loyalty/tiers/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tiers:', error);
      throw error;
    }
  },

  // Get perks for a specific tier
  getTierPerks: async (tierId: number): Promise<LoyaltyPerk[]> => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/loyalty/tiers/${tierId}/perks/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tier perks:', error);
      throw error;
    }
  },

  // Calculate points for a purchase amount
  calculatePointsForPurchase: async (amount: number): Promise<{
    estimated_points: number;
    multiplier: number;
    tier: string;
  }> => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/loyalty/calculate-points/`,
        { params: { amount } }
      );
      return response.data;
    } catch (error) {
      console.error('Error calculating points:', error);
      throw error;
    }
  },
};
