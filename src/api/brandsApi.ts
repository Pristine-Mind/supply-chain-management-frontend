import axios from 'axios';

const API_BASE_URL = 'https://appmulyabazzar.com/api/v1';

export interface Brand {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  country_of_origin?: string;
  is_verified?: boolean;
  products_count?: number;
}

export interface BrandProductImage {
  id: number;
  image: string;
  alt_text: string | null;
  created_at: string;
}

export interface BrandProductCategory {
  id: number;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subcategories_count: number;
}

export interface BrandProductBrand {
  id: number;
  name: string;
  logo_url?: string;
  is_verified: boolean;
  country_of_origin?: string;
}

export interface BrandProduct {
  id: number;
  images: BrandProductImage[];
  category_details: string;
  category_info: BrandProductCategory;
  subcategory_info: any;
  sub_subcategory_info: any;
  brand_info: BrandProductBrand;
  brand_name: string;
  brand_details: BrandProductBrand;
  size_display: string | null;
  color_display: string | null;
  name: string;
  old_category: string;
  description: string;
  sku: string | null;
  price: number;
  cost_price: number;
  stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_marketplace_created: boolean;
  size: string | null;
  color: string | null;
  additional_information: string;
  avg_daily_demand: number;
  stddev_daily_demand: number;
  safety_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  lead_time_days: number;
  projected_stockout_date_field: string | null;
  producer: number;
  brand: number;
  category: number;
  subcategory: number | null;
  sub_subcategory: number | null;
  user: number;
  location: number | null;
  is_b2b_eligible?: boolean;
  b2b_price?: number;
  b2b_discounted_price?: number;
  b2b_min_quantity?: number;
  marketplace_id?: string;
}

export interface BrandProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BrandProduct[];
}

export const fetchBrands = async (): Promise<Brand[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/brands/`, {
      timeout: 10000,
    });
    return response.data.results || response.data || [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw new Error('Failed to fetch brands');
  }
};

export const fetchBrandById = async (brandId: number): Promise<Brand> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/brands/${brandId}/`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching brand details:', error);
    throw new Error('Failed to fetch brand details');
  }
};

export const fetchBrandProducts = async (
  brandId: number,
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    sortBy?: string;
  }
): Promise<BrandProductsResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (filters?.search) params.append('search', filters.search);
    if (filters?.minPrice) params.append('min_price', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('max_price', filters.maxPrice.toString());
    if (filters?.category) params.append('category', filters.category);
    if (filters?.sortBy) params.append('ordering', filters.sortBy);

    const response = await axios.get(
      `${API_BASE_URL}/brands/${brandId}/products/?${params.toString()}`,
      {
        timeout: 10000,
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching brand products:', error);
    throw new Error('Failed to fetch brand products');
  }
};