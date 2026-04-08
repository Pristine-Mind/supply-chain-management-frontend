import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'https://appmulyabazzar.com';

export interface NewYearSaleProduct {
  id: number;
  name: string;
  original_price: number;
  discounted_price: number;
  discount_amount: number;
  discount_percentage: number;
  product_details?: any;
}

export interface ProductByBrand {
  brand_name: string;
  brand_id: number | null;
  product_count: number;
  products: any[];
}

export interface NewYearSale {
  id: number;
  name: string;
  description: string;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  sale_status: string;
  is_sale_active_now: boolean;
  days_remaining: number;
  products: number[];
  products_detail: any[];
  product_count: number;
  created_at: string;
  updated_at: string;
  created_by: number;
  created_by_username: string;
}

/**
 * Query parameters interface for flexible filtering
 */
export interface NewYearSaleQueryParams {
  // Pagination
  limit?: number;
  offset?: number;
  
  // Direct filters (DjangoFilterBackend)
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  discount_percentage?: number;
  
  // Search (SearchFilter)
  search?: string;
  
  // Status filter (custom in viewset)
  status?: 'active' | 'upcoming' | 'expired';
  
  // Date range filters (custom in viewset)
  start_date_from?: string;  // Filter: start_date >= this value
  end_date_to?: string;      // Filter: end_date <= this value
  
  // Discount range filters (custom in viewset)
  discount_min?: number;     // Filter: discount_percentage >= this value
  discount_max?: number;     // Filter: discount_percentage <= this value
  
  // Ordering (OrderingFilter)
  ordering?: 'start_date' | '-start_date' | 'created_at' | '-created_at' | 
            'discount_percentage' | '-discount_percentage' | 'end_date' | '-end_date';
}

/**
 * Helper function to get authorization headers
 */
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Token ${token}` } : {};
};

/**
 * Helper function to build query string from parameters, excluding undefined/null values
 */
const buildParams = (params?: Record<string, any>): Record<string, any> => {
  if (!params) return {};
  
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
};

/**
 * Core function to fetch sales with query parameters
 */
const fetchSalesWithParams = async (params?: NewYearSaleQueryParams) => {
  const headers = getHeaders();
  const cleanParams = buildParams(params);
  
  const response = await axios.get(`${API_BASE_URL}/api/v1/new-year-sales/`, {
    params: cleanParams,
    headers,
  });
  return response.data;
};

export const newYearSaleApi = {
  /**
   * Get all new year sales with comprehensive filtering, searching, and pagination support.
   * 
   * Supports:
   * - Direct filtering: is_active, start_date, end_date, discount_percentage
   * - Search: Searches name, description, product names, brand names, category names
   * - Pagination: limit, offset
   * - Date range: start_date_from, end_date_to
   * - Discount range: discount_min, discount_max
   * - Status: 'active', 'upcoming', 'expired'
   * - Ordering: Can order by start_date, created_at, discount_percentage, end_date
   * 
   * @example
   * // Get all active sales ordered by start date
   * await getSales({ status: 'active', ordering: '-start_date' })
   * 
   * // Search sales and filter by discount range
   * await getSales({ search: 'summer', discount_min: 10, discount_max: 50 })
   */
  getSales: async (params?: NewYearSaleQueryParams) => {
    return fetchSalesWithParams(params);
  },

  /**
   * Get a specific new year sale by ID with all product details
   */
  getSaleById: async (id: number) => {
    const headers = getHeaders();
    
    const response = await axios.get(`${API_BASE_URL}/api/v1/new-year-sales/${id}/`, {
      headers,
    });
    return response.data as NewYearSale;
  },

  /**
   * Get all currently active sales (running right now)
   * Convenience method - equivalent to getSales({ status: 'active' })
   */
  getActiveSales: async () => {
    return fetchSalesWithParams({ status: 'active' });
  },

  /**
   * Get all upcoming sales (starts in the future)
   * Convenience method - equivalent to getSales({ status: 'upcoming' })
   */
  getUpcomingSales: async () => {
    return fetchSalesWithParams({ status: 'upcoming' });
  },

  /**
   * Get all products in a sale with their discounted prices and discount details
   * 
   * @param saleId The ID of the sale
   * @returns Array of products with discount information
   */
  getDiscountedProducts: async (saleId: number) => {
    const headers = getHeaders();
    
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/new-year-sales/${saleId}/discounted_products/`,
      { headers }
    );
    return response.data as NewYearSaleProduct[];
  },

  /**
   * Get products in a sale grouped and organized by brand
   * Useful for brand-centric browsing
   * 
   * @param saleId The ID of the sale
   * @returns Array of products grouped by brand with brand metadata
   */
  getProductsByBrand: async (saleId: number) => {
    const headers = getHeaders();
    
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/new-year-sales/${saleId}/products_by_brand/`,
      { headers }
    );
    return response.data as ProductByBrand[];
  },

  /**
   * Filter sales by status with additional filtering options
   * 
   * @param status The sale status: 'active' (running now), 'upcoming' (future), or 'expired' (past)
   * @param params Additional filter parameters (search, discount range, date range, pagination)
   * @returns Sales matching the status and additional filters
   */
  getSalesByStatus: async (status: 'active' | 'upcoming' | 'expired', params?: Omit<NewYearSaleQueryParams, 'status'>) => {
    return fetchSalesWithParams({ ...params, status });
  },

  /**
   * Filter sales by discount percentage range
   * 
   * @param minDiscount Minimum discount percentage (inclusive)
   * @param maxDiscount Maximum discount percentage (inclusive)
   * @param params Additional filter parameters (search, status, pagination)
   * @returns Sales within the discount range
   * 
   * @example
   * // Get all sales with 20-50% discounts
   * await getSalesByDiscountRange(20, 50)
   */
  getSalesByDiscountRange: async (minDiscount: number, maxDiscount: number, params?: Omit<NewYearSaleQueryParams, 'discount_min' | 'discount_max'>) => {
    return fetchSalesWithParams({ 
      ...params, 
      discount_min: minDiscount, 
      discount_max: maxDiscount 
    });
  },

  /**
   * Filter sales by date range
   * 
   * @param startDate Start date (ISO format, e.g., '2026-04-14'). Filters sales starting on or after this date.
   * @param endDate End date (ISO format, e.g., '2026-05-14'). Filters sales ending on or before this date.
   * @param params Additional filter parameters (search, status, discount range, pagination)
   * @returns Sales within the date range
   * 
   * @example
   * // Get all sales in April
   * await getSalesByDateRange('2026-04-01', '2026-04-30')
   */
  getSalesByDateRange: async (startDate: string, endDate: string, params?: Omit<NewYearSaleQueryParams, 'start_date_from' | 'end_date_to'>) => {
    return fetchSalesWithParams({ 
      ...params, 
      start_date_from: startDate, 
      end_date_to: endDate 
    });
  },

  /**
   * Search sales by name, description, product names, brand names, or category names
   * 
   * @param searchTerm The search keyword
   * @param params Additional filter parameters (status, discount range, date range, pagination)
   * @returns Sales matching the search term
   * 
   * @example
   * // Search for "summer" sales
   * await searchSales('summer')
   * 
   * // Search for "electronics" sales with active status
   * await searchSales('electronics', { status: 'active' })
   */
  searchSales: async (searchTerm: string, params?: Omit<NewYearSaleQueryParams, 'search'>) => {
    return fetchSalesWithParams({ ...params, search: searchTerm });
  },

  /**
   * Get active sales by is_active flag
   * 
   * @param isActive Whether to get active (true) or inactive (false) sales
   * @param params Additional filter parameters
   * @returns Sales with matching active status
   */
  getSalesByActiveFlag: async (isActive: boolean, params?: Omit<NewYearSaleQueryParams, 'is_active'>) => {
    return fetchSalesWithParams({ ...params, is_active: isActive });
  },

  /**
   * Get sales ordered by creation date (newest first by default)
   * 
   * @param params Filter and pagination parameters
   * @param ascending If true, sort ascending (oldest first). Default false (newest first).
   * @returns Sales ordered by creation date
   */
  getSalesByCreationDate: async (params?: Omit<NewYearSaleQueryParams, 'ordering'>, ascending = false) => {
    return fetchSalesWithParams({ 
      ...params, 
      ordering: ascending ? 'created_at' : '-created_at' 
    });
  },

  /**
   * Get sales ordered by discount percentage
   * 
   * @param params Filter and pagination parameters
   * @param ascending If true, sort ascending (lowest discount first). Default false (highest discount first).
   * @returns Sales ordered by discount percentage
   */
  getSalesByDiscount: async (params?: Omit<NewYearSaleQueryParams, 'ordering'>, ascending = false) => {
    return fetchSalesWithParams({ 
      ...params, 
      ordering: ascending ? 'discount_percentage' : '-discount_percentage' 
    });
  },

  /**
   * Get sales with comprehensive filtering in one call
   * Combines status filter with discount and date range filters
   * 
   * @param options Comprehensive filter options
   * @returns Filtered sales
   * 
   * @example
   * // Get all active sales with 15-30% discount in April
   * await getSalesComprehensive({
   *   status: 'active',
   *   discountMin: 15,
   *   discountMax: 30,
   *   startDate: '2026-04-01',
   *   endDate: '2026-04-30'
   * })
   */
  getSalesComprehensive: async (options: {
    status?: 'active' | 'upcoming' | 'expired';
    searchTerm?: string;
    discountMin?: number;
    discountMax?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
    ordering?: 'start_date' | '-start_date' | 'discount_percentage' | '-discount_percentage';
    limit?: number;
    offset?: number;
  }) => {
    const params: NewYearSaleQueryParams = {};
    
    if (options.status) params.status = options.status;
    if (options.searchTerm) params.search = options.searchTerm;
    if (options.discountMin !== undefined) params.discount_min = options.discountMin;
    if (options.discountMax !== undefined) params.discount_max = options.discountMax;
    if (options.startDate) params.start_date_from = options.startDate;
    if (options.endDate) params.end_date_to = options.endDate;
    if (options.isActive !== undefined) params.is_active = options.isActive;
    if (options.ordering) params.ordering = options.ordering;
    if (options.limit) params.limit = options.limit;
    if (options.offset) params.offset = options.offset;
    
    return fetchSalesWithParams(params);
  },
};
