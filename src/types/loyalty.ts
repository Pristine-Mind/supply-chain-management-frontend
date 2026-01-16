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
