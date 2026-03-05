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

export interface SetDiscountRequest {
  discount_percentage: number;
}

export interface DiscountInfo {
  listed_price: number;
  discount_percentage: number;
  discounted_price: number;
  savings_amount: number;
}

export interface SetDiscountResponse {
  message: string;
  discount_applied: DiscountInfo;
  product?: any;
}

export interface GetDiscountResponse {
  discount_info: DiscountInfo;
}

/**
 * Discount validation helper functions
 */
const DiscountValidators = {
  /**
   * Validate discount percentage
   * @param percentage - Discount percentage to validate
   * @throws Error if validation fails
   */
  validatePercentage: (percentage: number): void => {
    if (typeof percentage !== 'number' || isNaN(percentage)) {
      throw new Error('Discount percentage must be a valid number');
    }
    if (percentage < 0) {
      throw new Error('Discount percentage cannot be negative');
    }
    if (percentage > 100) {
      throw new Error('Discount percentage cannot exceed 100%');
    }
    // Check for unrealistic values
    if (percentage === 100) {
      console.warn('⚠️ Setting 100% discount - product becomes free!');
    }
    if (percentage > 80) {
      console.warn(`⚠️ Very high discount set: ${percentage}%`);
    }
  },

  /**
   * Validate product ID
   * @param productId - Product ID to validate
   * @throws Error if validation fails
   */
  validateProductId: (productId: number): void => {
    if (!productId || typeof productId !== 'number' || productId <= 0) {
      throw new Error('Valid product ID is required');
    }
    if (!Number.isInteger(productId)) {
      throw new Error('Product ID must be an integer');
    }
  },

  /**
   * Validate response data integrity
   * @param response - API response to validate
   * @throws Error if response is invalid
   */
  validateResponse: (response: any): void => {
    if (!response) {
      throw new Error('Invalid response from server');
    }
    if (!response.discount_applied) {
      throw new Error('Missing discount_applied in response');
    }
    const discount = response.discount_applied;
    if (discount.listed_price === undefined || discount.discount_percentage === undefined) {
      throw new Error('Incomplete discount information in response');
    }
  }
};

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
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/create-from-product/`,
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
 * Set discount percentage for a marketplace product
 * Edge cases handled:
 * - Validates discount is 0-100%
 * - Checks product ID validity
 * - Validates response integrity
 * - Handles floating point precision
 */
export const setProductDiscount = async (
  marketplaceId: number,
  discountPercentage: number
): Promise<SetDiscountResponse> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  // Client-side validation
  try {
    DiscountValidators.validateProductId(marketplaceId);
    DiscountValidators.validatePercentage(discountPercentage);
  } catch (validationError) {
    throw new Error(`Validation failed: ${(validationError as Error).message}`);
  }

  try {
    const response = await axios.patch<SetDiscountResponse>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-products/${marketplaceId}/set-discount/`,
      { discount_percentage: discountPercentage },
      {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Validate response data
    try {
      DiscountValidators.validateResponse(response.data);
    } catch (validationError) {
      throw new Error(`Invalid server response: ${(validationError as Error).message}`);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific HTTP error codes
      if (error.response?.status === 404) {
        throw new Error('Product not found');
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication failed - please login again');
      }
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to modify this product');
      }
      if (error.response?.status === 400) {
        const errorData = error.response.data as any;
        throw new Error(
          errorData.message || 
          errorData.error || 
          'Invalid discount value - check constraints'
        );
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to set product discount'
      );
    }
    throw new Error('Network error occurred while setting product discount');
  }
};

/**
 * Get discount information for a marketplace product
 * Edge cases handled:
 * - Validates marketplace ID
 * - Checks for product existence
 * - Validates response data
 */
export const getProductDiscountInfo = async (
  marketplaceId: number
): Promise<GetDiscountResponse> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication token not found');
  }

  // Validate marketplace ID
  try {
    DiscountValidators.validateProductId(marketplaceId);
  } catch (validationError) {
    throw new Error(`Validation failed: ${(validationError as Error).message}`);
  }

  try {
    const response = await axios.get<GetDiscountResponse>(
      `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace-products/${marketplaceId}/discount-info/`,
      {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Validate response structure
    if (!response.data?.discount_info) {
      throw new Error('Invalid discount info response from server');
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific HTTP error codes
      if (error.response?.status === 404) {
        throw new Error('Product not found');
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication failed - please login again');
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to fetch product discount info'
      );
    }
    throw new Error('Network error occurred while fetching product discount info');
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
  createMarketplaceProductFromProduct,
  setProductDiscount,
  getProductDiscountInfo
};
