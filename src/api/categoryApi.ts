import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

// Type definitions for category hierarchy
export interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  subcategories_count?: number;
}

export interface Subcategory {
  id: number;
  category: number;
  category_info?: {
    id: number;
    code: string;
    name: string;
  };
  // Direct fields from API response
  category_name?: string;
  category_code?: string;
  code: string;
  name: string;
  description?: string;
  is_active?: boolean; // Made optional since it might not be in API response
  created_at?: string;
  updated_at?: string;
  sub_subcategories_count?: number;
}

export interface SubSubcategory {
  id: number;
  subcategory: number;
  subcategory_info?: {
    id: number;
    code: string;
    name: string;
    category_info?: {
      id: number;
      code: string;
      name: string;
    };
  };
  // Direct fields from API response (expected based on pattern)
  subcategory_name?: string;
  subcategory_code?: string;
  category_name?: string;
  category_code?: string;
  code: string;
  name: string;
  description?: string;
  is_active?: boolean; // Made optional since it might not be in API response
  created_at?: string;
  updated_at?: string;
}

export interface CategoryHierarchy {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  subcategories: Array<{
    id: number;
    code: string;
    name: string;
    description?: string;
    is_active: boolean;
    sub_subcategories: Array<{
      id: number;
      code: string;
      name: string;
      description?: string;
      is_active: boolean;
    }>;
  }>;
}

export interface CategoryInfo {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface ProductCategoryInfo {
  category_info?: CategoryInfo;
  subcategory_info?: CategoryInfo;
  sub_subcategory_info?: CategoryInfo;
  category_hierarchy?: string;
}

// API helper for authenticated requests
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Category API functions
export const categoryApi = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/categories/`);
      // Handle paginated response
      if (response.data && response.data.results) {
        return response.data.results;
      }
      // Handle direct array response
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Get specific category
  getCategory: async (id: number): Promise<Category> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/categories/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  },

  // Create new category (admin only)
  createCategory: async (categoryData: Partial<Category>): Promise<Category> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/categories/`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Update category (admin only)
  updateCategory: async (id: number, categoryData: Partial<Category>): Promise<Category> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/v1/categories/${id}/`, categoryData,);
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Delete category (admin only)
  deleteCategory: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/api/v1/categories/${id}/`, {
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Get complete category hierarchy
  getCategoryHierarchy: async (): Promise<CategoryHierarchy[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/categories/hierarchy/`);
      // Handle paginated response
      if (response.data && response.data.results) {
        return response.data.results;
      }
      // Handle direct array response
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching category hierarchy:', error);
      throw error;
    }
  },

  // Get subcategories for a specific category
  getSubcategoriesForCategory: async (categoryId: number): Promise<Subcategory[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/categories/${categoryId}/subcategories/`);
      // Handle paginated response
      if (response.data && response.data.results) {
        return response.data.results;
      }
      // Handle direct array response
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  },
};

// Subcategory API functions
export const subcategoryApi = {
  // Get all subcategories
  getSubcategories: async (categoryId?: number): Promise<Subcategory[]> => {
    try {
      const url = categoryId 
        ? `${API_BASE_URL}/api/v1/subcategories/?category=${categoryId}`
        : `${API_BASE_URL}/api/v1/subcategories/`;
      
      const response = await axios.get(url);
      // Handle paginated response
      if (response.data && response.data.results) {
        return response.data.results;
      }
      // Handle direct array response
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  },

  // Get specific subcategory
  getSubcategory: async (id: number): Promise<Subcategory> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/subcategories/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subcategory:', error);
      throw error;
    }
  },

  // Create new subcategory (admin only)
  createSubcategory: async (subcategoryData: Partial<Subcategory>): Promise<Subcategory> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/subcategories/`, subcategoryData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating subcategory:', error);
      throw error;
    }
  },

  // Update subcategory (admin only)
  updateSubcategory: async (id: number, subcategoryData: Partial<Subcategory>): Promise<Subcategory> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/v1/subcategories/${id}/`, subcategoryData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating subcategory:', error);
      throw error;
    }
  },

  // Delete subcategory (admin only)
  deleteSubcategory: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/api/v1/subcategories/${id}/`, {
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      throw error;
    }
  },

  // Get sub-subcategories for a specific subcategory
  getSubSubcategoriesForSubcategory: async (subcategoryId: number): Promise<SubSubcategory[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/subcategories/${subcategoryId}/sub_subcategories/`);
      // Handle paginated response
      if (response.data && response.data.results) {
        return response.data.results;
      }
      // Handle direct array response
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching sub-subcategories:', error);
      throw error;
    }
  },
};

// Sub-subcategory API functions
export const subSubcategoryApi = {
  // Get all sub-subcategories
  getSubSubcategories: async (subcategoryId?: number, categoryId?: number): Promise<SubSubcategory[]> => {
    try {
      let url = `${API_BASE_URL}/api/v1/sub-subcategories/`;
      const params = new URLSearchParams();
      
      if (subcategoryId) {
        params.append('subcategory', subcategoryId.toString());
      }
      if (categoryId) {
        params.append('category', categoryId.toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      // Handle paginated response
      if (response.data && response.data.results) {
        return response.data.results;
      }
      // Handle direct array response
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching sub-subcategories:', error);
      throw error;
    }
  },

  // Get specific sub-subcategory
  getSubSubcategory: async (id: number): Promise<SubSubcategory> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/sub-subcategories/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sub-subcategory:', error);
      throw error;
    }
  },

  // Create new sub-subcategory (admin only)
  createSubSubcategory: async (subSubcategoryData: Partial<SubSubcategory>): Promise<SubSubcategory> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/sub-subcategories/`, subSubcategoryData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating sub-subcategory:', error);
      throw error;
    }
  },

  // Update sub-subcategory (admin only)
  updateSubSubcategory: async (id: number, subSubcategoryData: Partial<SubSubcategory>): Promise<SubSubcategory> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/v1/sub-subcategories/${id}/`, subSubcategoryData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating sub-subcategory:', error);
      throw error;
    }
  },

  // Delete sub-subcategory (admin only)
  deleteSubSubcategory: async (id: number): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/api/v1/sub-subcategories/${id}/`, {
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting sub-subcategory:', error);
      throw error;
    }
  },
};

// Utility functions
export const categoryUtils = {
  // Format category hierarchy for display
  formatCategoryHierarchy: (category?: CategoryInfo, subcategory?: CategoryInfo, subSubcategory?: CategoryInfo): string => {
    const parts = [];
    if (category?.name) parts.push(category.name);
    if (subcategory?.name) parts.push(subcategory.name);
    if (subSubcategory?.name) parts.push(subSubcategory.name);
    return parts.join(' > ');
  },

  // Get category breadcrumb for navigation
  getCategoryBreadcrumb: (category?: CategoryInfo, subcategory?: CategoryInfo, subSubcategory?: CategoryInfo) => {
    const breadcrumb = [];
    if (category) {
      breadcrumb.push({ id: category.id, name: category.name, level: 'category' });
    }
    if (subcategory) {
      breadcrumb.push({ id: subcategory.id, name: subcategory.name, level: 'subcategory' });
    }
    if (subSubcategory) {
      breadcrumb.push({ id: subSubcategory.id, name: subSubcategory.name, level: 'sub_subcategory' });
    }
    return breadcrumb;
  },

  // Find category in hierarchy by ID
  findCategoryInHierarchy: (hierarchy: CategoryHierarchy[], categoryId: number) => {
    return hierarchy.find(cat => cat.id === categoryId);
  },

  // Find subcategory in hierarchy by ID
  findSubcategoryInHierarchy: (hierarchy: CategoryHierarchy[], subcategoryId: number) => {
    for (const category of hierarchy) {
      const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
      if (subcategory) {
        return { category, subcategory };
      }
    }
    return null;
  },

  // Find sub-subcategory in hierarchy by ID
  findSubSubcategoryInHierarchy: (hierarchy: CategoryHierarchy[], subSubcategoryId: number) => {
    for (const category of hierarchy) {
      for (const subcategory of category.subcategories) {
        const subSubcategory = subcategory.sub_subcategories.find(subSub => subSub.id === subSubcategoryId);
        if (subSubcategory) {
          return { category, subcategory, subSubcategory };
        }
      }
    }
    return null;
  },
};

// Export all APIs as default
export default {
  categoryApi,
  subcategoryApi,
  subSubcategoryApi,
  categoryUtils,
};