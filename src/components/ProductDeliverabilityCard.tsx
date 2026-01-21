import React from 'react';
import { AlertCircle, CheckCircle, MapPin, TrendingUp } from 'lucide-react';
import { useDeliverability } from '../hooks/useDeliverability';

interface ProductDeliverabilityCardProps {
  productId: number;
  productName?: string;
}

const ProductDeliverabilityCard: React.FC<ProductDeliverabilityCardProps> = ({
  productId,
  productName,
}) => {
  const { deliverability, loading, error } = useDeliverability({
    productId,
    cacheEnabled: true,
    maxCacheAge: 600000,
  });

  if (loading) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
          <div className="text-sm text-gray-600">Checking availability...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!deliverability) {
    return null;
  }

  const { is_deliverable, reason, estimated_days, shipping_cost, zone } = deliverability;

  if (is_deliverable) {
    return (
      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <p className="text-xs font-semibold text-green-900">Deliverable</p>
            <p className="text-xs text-green-700 mt-0.5">
              {estimated_days} day{estimated_days !== 1 ? 's' : ''} • {parseFloat(shipping_cost) === 0 ? 'Free' : `Rs ${shipping_cost}`}
            </p>
            <p className="text-xs text-green-600 mt-1">{zone}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-grow">
          <p className="text-xs font-semibold text-amber-900">Not Available</p>
          <p className="text-xs text-amber-700 mt-0.5">{reason}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDeliverabilityCard;
