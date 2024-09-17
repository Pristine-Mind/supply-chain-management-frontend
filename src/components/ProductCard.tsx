import React from 'react';

interface ProductImage {
  id: number;
  image: string;
  alt_text: string | null;
}

interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock: number;
  is_active: boolean;
  category: string;
  images: ProductImage[];
  category_details: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-2">{product.name}</h3>
      <p className="text-gray-500 mb-2">
        <span className="font-semibold">Category:</span> {product.category_details}
      </p>
      <p className="text-gray-700 mb-2">{product.description}</p>
      <p className="text-gray-500 mb-2">SKU: {product.sku}</p>
      <p className="text-gray-500 mb-2">Price: ${product.price}</p>
      <p className="text-gray-500 mb-2">Stock: {product.stock}</p>
      <span
        className={`inline-block px-3 py-1 text-sm ${
          product.is_active ? 'bg-green-500' : 'bg-red-500'
        } text-white rounded-full`}
      >
        {product.is_active ? 'Active' : 'Inactive'}
      </span>

      {/* Display Product Images */}
      <div className="mt-4">
        {product.images.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {product.images.map((image) => (
              <img
                key={image.id}
                src={image.image}
                alt={image.alt_text || 'Product Image'}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No images available</p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
