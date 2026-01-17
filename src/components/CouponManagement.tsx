import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  DollarSign,
  Percent,
  AlertCircle,
  Loader,
  CheckCircle,
  X,
} from 'lucide-react';
import {
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  couponApi,
} from '../api/couponsApi';
import { Coupon, DiscountType, CouponErrorType } from '../types/coupon';
import { toast } from 'react-toastify';

interface CouponFormData {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount?: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  user_limit: number;
  is_active: boolean;
}

interface CouponManagementProps {
  /**
   * Additional CSS classes
   */
  className?: string;
}

const initialFormData: CouponFormData = {
  code: '',
  discount_type: 'percentage',
  discount_value: 0,
  min_purchase_amount: 0,
  max_discount_amount: undefined,
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  usage_limit: 100,
  user_limit: 1,
  is_active: true,
};

/**
 * CouponManagement Component
 * Admin panel for managing coupons (CRUD operations)
 * Provides interface to create, edit, delete, and list coupons
 */
const CouponManagement: React.FC<CouponManagementProps> = ({ className = '' }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Fetch all coupons from API
   */
  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await couponApi.listCoupons();
      setCoupons(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupons');
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  /**
   * Handle form input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
          ? parseFloat(value) || 0
          : value,
      }));
    },
    []
  );

  /**
   * Handle form submission (create or update)
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validation
      if (!formData.code.trim()) {
        toast.error('Coupon code is required');
        return;
      }
      if (formData.discount_value <= 0) {
        toast.error('Discount value must be greater than 0');
        return;
      }
      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        toast.error('End date must be after start date');
        return;
      }

      setSubmitting(true);

      try {
        if (editingCoupon) {
          // Update existing coupon
          await couponApi.updateCoupon(editingCoupon.code, formData);
          toast.success('Coupon updated successfully');
          setEditingCoupon(null);
        } else {
          // Create new coupon
          await couponApi.createCoupon(formData);
          toast.success('Coupon created successfully');
        }

        // Reset form and refresh list
        setFormData(initialFormData);
        setShowForm(false);
        await fetchCoupons();
      } catch (err: any) {
        toast.error(err.message || 'Failed to save coupon');
      } finally {
        setSubmitting(false);
      }
    },
    [formData, editingCoupon, fetchCoupons]
  );

  /**
   * Handle edit coupon
   */
  const handleEdit = useCallback((coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase_amount: coupon.min_purchase_amount,
      max_discount_amount: coupon.max_discount_amount,
      start_date: coupon.start_date.split('T')[0],
      end_date: coupon.end_date.split('T')[0],
      usage_limit: coupon.usage_limit,
      user_limit: coupon.user_limit,
      is_active: coupon.is_active,
    });
    setShowForm(true);
  }, []);

  /**
   * Handle delete coupon
   */
  const handleDelete = useCallback(async (code: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${code}?`)) {
      return;
    }

    try {
      await couponApi.deleteCoupon(code);
      toast.success('Coupon deleted successfully');
      await fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete coupon');
    }
  }, [fetchCoupons]);

  /**
   * Handle cancel form
   */
  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingCoupon(null);
    setFormData(initialFormData);
  }, []);

  /**
   * Filter coupons based on search term
   */
  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Check if coupon is active
   */
  const isCouponActive = (coupon: Coupon): boolean => {
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);
    return coupon.is_active && now >= startDate && now <= endDate;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-600 mt-1">Create and manage discount coupons</p>
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setFormData(initialFormData);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>New Coupon</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coupon Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  disabled={!!editingCoupon}
                  placeholder="SUMMER20"
                  maxLength={20}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Will be converted to uppercase automatically</p>
              </div>

              {/* Discount Type */}
              <div>
                <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type
                </label>
                <select
                  id="discount_type"
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rs.)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  id="discount_value"
                  name="discount_value"
                  value={formData.discount_value}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Min Purchase Amount */}
              <div>
                <label htmlFor="min_purchase_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Purchase Amount (Rs.)
                </label>
                <input
                  type="number"
                  id="min_purchase_amount"
                  name="min_purchase_amount"
                  value={formData.min_purchase_amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Max Discount Amount (for percentage) */}
              {formData.discount_type === 'percentage' && (
                <div>
                  <label htmlFor="max_discount_amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Discount Cap (Rs.) (Optional)
                  </label>
                  <input
                    type="number"
                    id="max_discount_amount"
                    name="max_discount_amount"
                    value={formData.max_discount_amount || ''}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Start Date */}
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Usage Limit */}
              <div>
                <label htmlFor="usage_limit" className="block text-sm font-medium text-gray-700 mb-1">
                  Total Usage Limit
                </label>
                <input
                  type="number"
                  id="usage_limit"
                  name="usage_limit"
                  value={formData.usage_limit}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* User Limit */}
              <div>
                <label htmlFor="user_limit" className="block text-sm font-medium text-gray-700 mb-1">
                  Per-User Usage Limit
                </label>
                <input
                  type="number"
                  id="user_limit"
                  name="user_limit"
                  value={formData.user_limit}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader size={16} className="animate-spin" />}
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by coupon code..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="animate-spin text-primary-600" size={32} />
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No coupons found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCoupons.map(coupon => (
                <tr key={coupon.code} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-semibold text-gray-900">
                    {coupon.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {coupon.discount_type === 'percentage' ? (
                        <Percent size={16} className="text-blue-600" />
                      ) : (
                        <DollarSign size={16} className="text-green-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        {coupon.discount_value}
                        {coupon.discount_type === 'percentage' ? '%' : 'Rs.'}
                      </span>
                      {coupon.max_discount_amount && (
                        <span className="text-xs text-gray-500">
                          (cap: Rs.{coupon.max_discount_amount})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(coupon.start_date)} to {formatDate(coupon.end_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {coupon.used_count} / {coupon.usage_limit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isCouponActive(coupon) ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <X size={16} />
                        <span className="text-sm font-medium">Inactive</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2 flex">
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit coupon"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.code)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
