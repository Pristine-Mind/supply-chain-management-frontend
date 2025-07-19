import React, { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { Calendar as CalendarIcon, Loader2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from './ui/button';

interface Product {
  id: number;
  name: string;
  price: number;
}

interface FormData {
  product: number;
  quantity: number;
  unit_price: string;
  total_price: string;
  sale_date: Date;
  reference: string;
  notes?: string;
}

const schema = yup.object({
  product: yup.number().required('Product is required').min(1, 'Product is required'),
  quantity: yup.number().required('Quantity is required').min(1, 'Quantity must be at least 1'),
  unit_price: yup.string().required('Unit price is required').matches(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  total_price: yup.string().required('Total price is required').matches(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  sale_date: yup.date().required('Sale date is required'),
  reference: yup.string().notRequired(),
  notes: yup.string().notRequired(),
}).required();

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${className}`}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

const Label = ({ children, htmlFor, className = '' }: { children: React.ReactNode; htmlFor?: string; className?: string }) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 mb-2 ${className}`}
  >
    {children}
  </label>
);

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea
      className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[100px] ${className}`}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

const DirectSales = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/products`, {
          headers: {
            Authorization: `Token ${localStorage.getItem('token')}`,
          },
        });
        setProducts(response.data.results);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const { register, handleSubmit, control, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      product: 0,
      quantity: 1,
      unit_price: '0.00',
      total_price: '0.00',
      sale_date: new Date(),
      reference: '',
      notes: '',
    },
  });

  const quantity = useWatch({ control, name: 'quantity' });
  const unitPrice = useWatch({ control, name: 'unit_price' });

  useEffect(() => {
    const total = (parseFloat(unitPrice || '0') * (quantity || 0)).toFixed(2);
    setValue('total_price', total);
  }, [quantity, unitPrice, setValue]);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = parseInt(e.target.value);
    const selected = products.find((p) => p.id === productId);
    setSelectedProduct(selected || null);

    if (selected) {
      setValue('unit_price', selected.price.toFixed(2));
    } else {
      setValue('unit_price', '0.00');
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setApiError(null);
      setIsLoading(true);
      const auth = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/direct-sales/`, {
        product: data.product,
        quantity: Number(data.quantity),
        unit_price: parseFloat(data.unit_price),
        total_price: parseFloat(data.total_price),
        sale_date: data.sale_date.toISOString().split('T')[0],
        reference: data.reference,
        notes: data.notes,
      }, {
        headers: {
          Authorization: `Token ${auth}`,
        },
      });
      reset();
    } catch (error) {
      console.error('Error creating direct sale:', error);
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.data) {
          if (typeof error.response.data === 'object' && error.response.data.detail) {
            setApiError(error.response.data.detail);
          } else if (typeof error.response.data === 'string') {
            setApiError(error.response.data);
          } else if (error.response.data.non_field_errors) {
            setApiError(error.response.data.non_field_errors.join(' '));
          } else if (typeof error.response.data === 'object') {
            const fieldErrors = Object.entries(error.response.data as Record<string, string[]>)
              .map(([field, messages]) => `${field}: ${messages.join(' ')}`)
              .join('\n');
            setApiError(fieldErrors || 'An error occurred');
          }
        } else {
          setApiError('An unexpected error occurred');
        }
      } else {
        setApiError('Network error. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md border border-orange-400">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Direct Sale</h1>
      <p className="text-sm text-gray-600 mb-6">
        Fill in the details below to record a direct sale.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {apiError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 whitespace-pre-wrap">{apiError}</p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
          <Label htmlFor="product">Product</Label>
          {isProductsLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
              <span>Loading products...</span>
            </div>
          ) : (
            <select
              id="product"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('product')}
              onChange={handleProductChange}
            >
              <option value="0">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          )}
          {errors.product && (
            <p className="text-red-500 text-sm mt-1">{errors.product.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <Label htmlFor="unit_price">Unit Price (NPR)</Label>
            <Input
              id="unit_price"
              type="number"
              step="0.01"
              readOnly={!!selectedProduct}
              style={{ backgroundColor: selectedProduct ? '#f3f4f6' : 'white' }}
              {...register('unit_price')}
            />
            {errors.unit_price && (
              <p className="text-red-500 text-sm mt-1">{errors.unit_price.message}</p>
            )}
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              {...register('quantity')}
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
            )}
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <Label className="text-blue-700" htmlFor="total_price">Total Price (NPR)</Label>
            <Input
              id="total_price"
              type="text"
              readOnly
              value={watch('total_price')}
              className="font-bold text-blue-700"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
          <Label htmlFor="sale_date">Sale Date</Label>
          <Controller
            control={control}
            name="sale_date"
            render={({ field }) => (
              <div className="relative">
                <Input
                  type="date"
                  value={format(field.value, 'yyyy-MM-dd')}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                />
                <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
            )}
          />
          {errors.sale_date && (
            <p className="text-sm text-red-500 mt-1">{errors.sale_date.message}</p>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
          <Label htmlFor="reference">Reference</Label>
          <Input id="reference" {...register('reference')} />
          {errors.reference && (
            <p className="text-sm text-red-500 mt-1">{errors.reference.message}</p>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register('notes')} rows={3} />
        </div>

        <div className="flex justify-end space-x-4 pt-8 mt-6 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={isLoading}
            className="px-6 py-2 text-gray-700 hover:bg-gray-50 border-gray-300"
          >
            Reset Form
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                Saving...
              </span>
            ) : (
              'Save Sale'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DirectSales;
