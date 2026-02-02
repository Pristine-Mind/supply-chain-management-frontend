import axios from 'axios';

// Filter option types
export interface FilterCategory {
  id: number;
  name: string;
  code: string;
}

export interface FilterBrand {
  id: number;
  name: string;
}

export interface FilterSize {
  value: string;
  label: string;
}

export interface FilterColor {
  value: string;
  label: string;
}

export interface FilterPriceRange {
  value: string;
  label: string;
  min: number;
  max: number | null;
}

export interface FilterStockStatus {
  value: string;
  label: string;
}

export interface FilterDeliveryTime {
  value: string;
  label: string;
}

export interface FilterSortOption {
  value: string;
  label: string;
}

export interface FilterOptionsResponse {
  categories: FilterCategory[];
  brands: FilterBrand[];
  sizes: FilterSize[];
  colors: FilterColor[];
  price_ranges: FilterPriceRange[];
  stock_statuses: FilterStockStatus[];
  delivery_times: FilterDeliveryTime[];
  sort_options: FilterSortOption[];
}

export interface CreateMarketplaceProductRequest {
  product_id: number;
  listed_price?: number;
  discounted_price?: number;
  size?: string;
  color?: string;
  additional_information?: string;
  min_order?: number;
  offer_start?: string;
  offer_end?: string;
  estimated_delivery_days?: number;
  shipping_cost?: string;
  is_featured?: boolean;
  is_made_in_nepal?: boolean;
}

export interface MarketplaceProductResponse {
  message: string;
  data: {
    id: number;
    product: number;
    product_details: {
      id: number;
      name: string;
      description: string;
      price: number;
      size?: string;
      color?: string;
      [key: string]: any;
    };
    listed_price: number;
    discounted_price?: number;
    size?: string;
    color?: string;
    size_display?: string;
    color_display?: string;
    effective_size?: string;
    effective_color?: string;
    additional_information?: string;
    is_available: boolean;
    is_featured: boolean;
    is_made_in_nepal: boolean;
    listed_date: string;
    [key: string]: any;
  };
}

export interface MarketplaceProductError {
  error?: string;
  product_id?: string[];
  [key: string]: any;
}

/**
 * Creates a marketplace product from an existing product
 */
export const createMarketplaceProductFromProduct = async (
  data: CreateMarketplaceProductRequest
): Promise<MarketplaceProductResponse> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  try {
    const response = await axios.post<MarketplaceProductResponse>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/marketplace-products/create-from-product/`,
      data,
      {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      throw new Error(
        error.response.data.error || 
        error.response.data.product_id?.[0] || 
        'Failed to create marketplace product'
      );
    }
    throw new Error('Network error occurred while creating marketplace product');
  }
};

/**
 * Fetch filter options for marketplace
 */
export const getFilterOptions = async (): Promise<FilterOptionsResponse> => {
  try {
    const response = await axios.get<FilterOptionsResponse>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/filter-options/`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw error;
  }
};

/**
 * Marketplace API object for unified access
 */
export const marketplaceApi = {
  getProducts: async (params: { q?: string; category?: number }) => {
    const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`, {
      params
    });
    return response.data;
  },
  getFilterOptions,
  createMarketplaceProductFromProduct
};
