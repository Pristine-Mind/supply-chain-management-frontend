export interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  images: ProductImage[];
  stock?: number;
  category_details?: {
    id: number;
    name: string;
  };
}

export interface BulkPriceTier {
  min_quantity: number;
  price: string;
  price_per_unit: string;
  discount_percent: number;
}

export interface RatingBreakdown {
  [key: number]: number;
}

export interface MarketplaceProduct {
  id: number;
  product: Product;
  listed_price: string;
  listed_date: string;
  is_available: boolean;
  bid_end_date: string | null;
  product_details: Product;
  is_offer_active?: boolean;
  discounted_price?: string;
  percent_off?: number;
  is_free_shipping?: boolean;
  shipping_cost?: string;
  bulk_price_tiers?: BulkPriceTier[];
  min_order?: number;
  ratings_breakdown?: RatingBreakdown;
  reviews?: Array<{
    id: number;
    rating: number;
    comment: string;
    review_text?: string;
    created_at: string;
    user: {
      username: string;
      [key: string]: any;
    };
  }>;
}