import React, { useEffect, useState } from 'react';
import { MapPin, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useLocation } from '../context/LocationContext';

const LocationPermissionBanner: React.FC = () => {
  const { permissionRequested, hasPermission, requestPermission, loading, error } = useLocation();
  const [dismissed, setDismissed] = useState(false);

  // Auto-dismiss after 5 minute if permission granted
  useEffect(() => {
    if (hasPermission && !dismissed) {
      const timer = setTimeout(() => setDismissed(true), 50000);
      return () => clearTimeout(timer);
    }
  }, [hasPermission, dismissed]);

  // Don't show if already requested or dismissed
  if (permissionRequested || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="bg-white rounded-lg shadow-lg border border-orange-200 overflow-hidden">
        {/* Permission Request Card */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-grow">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Enable Location Services
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Share your location to check product deliverability and get personalized offers
              </p>

              {error && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-red-50 rounded border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {hasPermission && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700">Location access granted</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => requestPermission()}
                  disabled={loading || hasPermission}
                  className="flex-1 px-3 py-2 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Requesting...' : hasPermission ? 'Granted' : 'Allow'}
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionBanner;
