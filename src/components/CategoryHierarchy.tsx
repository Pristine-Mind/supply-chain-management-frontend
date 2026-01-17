import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Package } from 'lucide-react';
import { 
  categoryApi, 
  subcategoryApi, 
  subSubcategoryApi,
  CategoryHierarchy,
  Category,
  Subcategory,
  SubSubcategory,
  categoryUtils
} from '../api/categoryApi';

interface CategorySelectorProps {
  selectedCategory?: number | null;
  selectedSubcategory?: number | null;
  selectedSubSubcategory?: number | null;
  onCategoryChange?: (categoryId: number | null) => void;
  onSubcategoryChange?: (subcategoryId: number | null) => void;
  onSubSubcategoryChange?: (subSubcategoryId: number | null) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showHierarchy?: boolean;
  mode?: 'dropdown' | 'tree' | 'breadcrumb';
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  selectedSubcategory,
  selectedSubSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  onSubSubcategoryChange,
  className = '',
  placeholder = 'Select category...',
  required = false,
  disabled = false,
  showHierarchy = false,
  mode = 'dropdown'
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subSubcategories, setSubSubcategories] = useState<SubSubcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [subcategoryDropdownOpen, setSubcategoryDropdownOpen] = useState(false);
  const [subSubcategoryDropdownOpen, setSubSubcategoryDropdownOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subcategoryDropdownRef = useRef<HTMLDivElement>(null);
  const subSubcategoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
      setSubSubcategories([]);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedSubcategory) {
      loadSubSubcategories(selectedSubcategory);
    } else {
      setSubSubcategories([]);
    }
  }, [selectedSubcategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (categoryDropdownOpen && categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setCategoryDropdownOpen(false);
      }
      
      if (subcategoryDropdownOpen && subcategoryDropdownRef.current && !subcategoryDropdownRef.current.contains(target)) {
        setSubcategoryDropdownOpen(false);
      }
      
      if (subSubcategoryDropdownOpen && subSubcategoryDropdownRef.current && !subSubcategoryDropdownRef.current.contains(target)) {
        setSubSubcategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryDropdownOpen, subcategoryDropdownOpen, subSubcategoryDropdownOpen]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryApi.getCategories();
      setCategories(data.filter(cat => cat.is_active));
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubcategories = async (categoryId: number) => {
    try {
      const data = await subcategoryApi.getSubcategories(categoryId);
      setSubcategories(data);
    } catch (err) {
      console.error('Error loading subcategories:', err);
    }
  };

  const loadSubSubcategories = async (subcategoryId: number) => {
    try {
      const data = await subSubcategoryApi.getSubSubcategories(subcategoryId);
      setSubSubcategories(data);
    } catch (err) {
      console.error('Error loading sub-subcategories:', err);
    }
  };

  const handleCategoryChange = (categoryId: number | null) => {
    console.log('Category changed to:', categoryId);
    onCategoryChange?.(categoryId);
    onSubcategoryChange?.(null);
    onSubSubcategoryChange?.(null);
  };

  const handleSubcategoryChange = (subcategoryId: number | null) => {
    console.log('Subcategory changed to:', subcategoryId);
    onSubcategoryChange?.(subcategoryId);
    onSubSubcategoryChange?.(null);
  };

  const renderDropdownMode = () => (
    <div className={`space-y-2 ${className}`}>
      <div className="relative" ref={categoryDropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-left flex items-center justify-between hover:border-primary-400"
            disabled={disabled || loading}
          >
            <span className={selectedCategory ? "text-gray-900" : "text-gray-500"}>
              {selectedCategory ? categories.find(cat => cat.id === selectedCategory)?.name : "Select a category..."}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {categoryDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-xl shadow-lg max-h-60 overflow-auto">
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    handleCategoryChange(null);
                    setCategoryDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                >
                  Select a category...
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      handleCategoryChange(category.id);
                      setCategoryDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-primary-50 rounded-lg transition-colors ${
                      selectedCategory === category.id ? 'bg-primary-100 text-primary-900 font-medium' : 'text-gray-900'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {loading && (
          <div className="text-xs text-blue-500 mt-1">
            Loading categories...
          </div>
        )}
        {error && (
          <div className="text-xs text-red-500 mt-1">
            {error}
          </div>
        )}
      </div>

      {selectedCategory && (
        <div className="relative" ref={subcategoryDropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategory
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSubcategoryDropdownOpen(!subcategoryDropdownOpen)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-left flex items-center justify-between hover:border-primary-400"
              disabled={disabled || subcategories.length === 0}
            >
              <span className={selectedSubcategory ? "text-gray-900" : "text-gray-500"}>
                {selectedSubcategory ? subcategories.find(sub => sub.id === selectedSubcategory)?.name : "Select a subcategory..."}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${subcategoryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {subcategoryDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleSubcategoryChange(null);
                      setSubcategoryDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                  >
                    Select a subcategory...
                  </button>
                  {subcategories.map(subcategory => (
                    <button
                      key={subcategory.id}
                      type="button"
                      onClick={() => {
                        handleSubcategoryChange(subcategory.id);
                        setSubcategoryDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-primary-50 rounded-lg transition-colors ${
                        selectedSubcategory === subcategory.id ? 'bg-primary-100 text-primary-900 font-medium' : 'text-gray-900'
                      }`}
                    >
                      {subcategory.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {subcategories.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {subcategories.length} subcategories loaded
            </div>
          )}
          {subcategories.length === 0 && selectedCategory && (
            <div className="text-xs text-yellow-600 mt-1">
              No subcategories found for this category
            </div>
          )}
        </div>
      )}

        {selectedSubcategory && (
        <div className="relative" ref={subSubcategoryDropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sub-subcategory
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSubSubcategoryDropdownOpen(!subSubcategoryDropdownOpen)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-left flex items-center justify-between hover:border-primary-400"
              disabled={disabled || subSubcategories.length === 0}
            >
              <span className={selectedSubSubcategory ? "text-gray-900" : "text-gray-500"}>
                {selectedSubSubcategory ? subSubcategories.find(subSub => subSub.id === selectedSubSubcategory)?.name : "Select a sub-subcategory..."}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${subSubcategoryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {subSubcategoryDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSubSubcategoryChange?.(null);
                      setSubSubcategoryDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                  >
                    Select a sub-subcategory...
                  </button>
                  {subSubcategories.map(subSubcategory => (
                    <button
                      key={subSubcategory.id}
                      type="button"
                      onClick={() => {
                        onSubSubcategoryChange?.(subSubcategory.id);
                        setSubSubcategoryDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-primary-50 rounded-lg transition-colors ${
                        selectedSubSubcategory === subSubcategory.id ? 'bg-primary-100 text-primary-900 font-medium' : 'text-gray-900'
                      }`}
                    >
                      {subSubcategory.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {subSubcategories.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {subSubcategories.length} sub-subcategories loaded
            </div>
          )}
          {subSubcategories.length === 0 && selectedSubcategory && (
            <div className="text-xs text-yellow-600 mt-1">
              No sub-subcategories found for this subcategory
            </div>
          )}
        </div>
      )}

      {showHierarchy && (selectedCategory || selectedSubcategory || selectedSubSubcategory) && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-1">Selected path:</p>
          <p className="text-sm font-medium text-gray-900">
            {categoryUtils.formatCategoryHierarchy(
              categories.find(c => c.id === selectedCategory),
              subcategories.find(s => s.id === selectedSubcategory),
              subSubcategories.find(ss => ss.id === selectedSubSubcategory)
            )}
          </p>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  );

  if (mode === 'dropdown') {
    return renderDropdownMode();
  }
  return renderDropdownMode();
};

interface CategoryDisplayProps {
  categoryInfo?: {
    id: number;
    code: string;
    name: string;
  };
  subcategoryInfo?: {
    id: number;
    code: string;
    name: string;
  };
  subSubcategoryInfo?: {
    id: number;
    code: string;
    name: string;
  };
  className?: string;
  showIcon?: boolean;
  showCode?: boolean;
  separator?: string;
  onClick?: () => void;
}

export const CategoryDisplay: React.FC<CategoryDisplayProps> = ({
  categoryInfo,
  subcategoryInfo,
  subSubcategoryInfo,
  className = '',
  showIcon = true,
  showCode = false,
  separator = ' > ',
  onClick
}) => {
  const formatDisplayText = () => {
    const parts = [];
    
    if (categoryInfo) {
      const categoryText = showCode ? `${categoryInfo.code} - ${categoryInfo.name}` : categoryInfo.name;
      parts.push(categoryText);
    }
    
    if (subcategoryInfo) {
      const subcategoryText = showCode ? `${subcategoryInfo.code} - ${subcategoryInfo.name}` : subcategoryInfo.name;
      parts.push(subcategoryText);
    }
    
    if (subSubcategoryInfo) {
      const subSubText = showCode ? `${subSubcategoryInfo.code} - ${subSubcategoryInfo.name}` : subSubcategoryInfo.name;
      parts.push(subSubText);
    }
    
    return parts.join(separator);
  };

  const displayText = formatDisplayText();

  if (!displayText) {
    return (
      <span className={`text-gray-400 text-sm ${className}`}>
        No category selected
      </span>
    );
  }

  return (
    <div 
      className={`flex items-center gap-2 ${onClick ? 'cursor-pointer hover:text-primary-600' : ''} ${className}`}
      onClick={onClick}
    >
      {showIcon && <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      <span className="text-sm text-gray-700 truncate">{displayText}</span>
    </div>
  );
};

interface CategoryBreadcrumbProps {
  categoryInfo?: {
    id: number;
    code: string;
    name: string;
  };
  subcategoryInfo?: {
    id: number;
    code: string;
    name: string;
  };
  subSubcategoryInfo?: {
    id: number;
    code: string;
    name: string;
  };
  onCategoryClick?: (categoryId: number) => void;
  onSubcategoryClick?: (subcategoryId: number) => void;
  onSubSubcategoryClick?: (subSubcategoryId: number) => void;
  className?: string;
}

export const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({
  categoryInfo,
  subcategoryInfo,
  subSubcategoryInfo,
  onCategoryClick,
  onSubcategoryClick,
  onSubSubcategoryClick,
  className = ''
}) => {
  const breadcrumbItems = [];

  if (categoryInfo) {
    breadcrumbItems.push({
      id: categoryInfo.id,
      name: categoryInfo.name,
      onClick: () => onCategoryClick?.(categoryInfo.id)
    });
  }

  if (subcategoryInfo) {
    breadcrumbItems.push({
      id: subcategoryInfo.id,
      name: subcategoryInfo.name,
      onClick: () => onSubcategoryClick?.(subcategoryInfo.id)
    });
  }

  if (subSubcategoryInfo) {
    breadcrumbItems.push({
      id: subSubcategoryInfo.id,
      name: subSubcategoryInfo.name,
      onClick: () => onSubSubcategoryClick?.(subSubcategoryInfo.id)
    });
  }

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      <Package className="w-4 h-4 text-gray-400" />
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <ChevronRight className="w-3 h-3 text-gray-400" />
          )}
          <button
            onClick={item.onClick}
            className={`${
              index === breadcrumbItems.length - 1
                ? 'text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            } hover:underline transition-colors`}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default {
  CategorySelector,
  CategoryDisplay,
  CategoryBreadcrumb
};