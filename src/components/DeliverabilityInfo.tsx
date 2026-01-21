import React from 'react';
import { AlertCircle, CheckCircle, Truck, MapPin, Clock } from 'lucide-react';
import { DeliverabilityResponse } from '../api/geoApi';

interface DeliverabilityInfoProps {
  deliverability: DeliverabilityResponse | null;
  loading: boolean;
  error: string | null;
  compact?: boolean;
}

const DeliverabilityInfo: React.FC<DeliverabilityInfoProps> = ({
  deliverability,
  loading,
  error,
  compact = false,
}) => {
  if (loading) {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} bg-gray-50 rounded-lg border border-gray-200`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="text-sm text-gray-600">Checking deliverability...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} bg-red-50 rounded-lg border border-red-200`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-900">Unable to Check Delivery</h4>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
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
      <div className={`${compact ? 'p-2' : 'p-4'} bg-green-50 rounded-lg border border-green-200`}>
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <h4 className="text-sm font-semibold text-green-900">Available for Delivery</h4>
            {!compact && (
              <div className={`mt-2 space-y-2 text-sm text-green-800`}>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>Zone: {zone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Estimated delivery: {estimated_days} day{estimated_days !== 1 ? 's' : ''}</span>
                </div>
                {/* <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Shipping: {parseFloat(shipping_cost) === 0 ? 'Free' : `Rs ${shipping_cost}`}
                  </span>
                </div> */}
              </div>
            )}
            {compact && (
              <p className="text-xs text-green-700 mt-1">
                {estimated_days} day delivery • {parseFloat(shipping_cost) === 0 ? 'Free shipping' : `Rs ${shipping_cost}`}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'p-2' : 'p-4'} bg-amber-50 rounded-lg border border-amber-200`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-grow">
          <h4 className="text-sm font-semibold text-amber-900">Not Available in Your Area</h4>
          <p className="text-xs text-amber-700 mt-0.5">{reason}</p>
          {!compact && (
            <div className="mt-2">
              <p className="text-xs text-amber-800">
                Zone: <span className="font-medium">{zone}</span>
              </p>
              {estimated_days && (
                <p className="text-xs text-amber-800 mt-1">
                  Extended delivery: {estimated_days} days
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliverabilityInfo;
