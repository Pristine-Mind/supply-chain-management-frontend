import React from 'react';

interface CategoryMenuProps {
  categories: Array<{
    id: number;
    name: string;
    subcategories: Array<{ id: number; name: string }>;
  }>;
  onSelect?: (categoryId: number, subcategoryId?: number | null) => void;
}

const CategoryMenu: React.FC<CategoryMenuProps> = ({ categories, onSelect }) => {
  return (
    <div className="w-full py-0 px-0">
      <div className="bg-white rounded-lg shadow-lg border border-neutral-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {categories.map((cat) => (
          <div key={cat.id}>
            <button
              onClick={() => onSelect && onSelect(cat.id, null)}
              className="font-bold text-lg mb-2 text-left w-full text-neutral-900 hover:text-primary-600"
            >
              {cat.name}
            </button>
            <ul className="space-y-2 mt-2">
              {cat.subcategories.map((sub) => (
                <li key={sub.id}>
                  <button
                    onClick={() => onSelect && onSelect(cat.id, sub.id)}
                    className="text-gray-700 hover:text-primary-600 cursor-pointer text-left w-full"
                  >
                    {sub.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        </div>
        <div className="flex justify-between mt-6 text-sm text-gray-500">
          <button type="button" className="hover:text-primary-600 font-medium" onClick={() => { /* TODO: wire to /brands */ }}>
            All Brands &gt;
          </button>
          <button type="button" className="hover:text-primary-600 font-medium" onClick={() => { /* TODO: wire to /categories */ }}>
            All Categories &gt;
          </button>
          <button type="button" className="hover:text-primary-600 font-medium" onClick={() => { /* TODO: wire to /deals */ }}>
            Seasonal Sales &amp; Events &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryMenu;
