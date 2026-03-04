import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  MapPin, 
  Building2, 
  Shield, 
  Store, 
  Calendar, 
  DollarSign, 
  Target,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Star
} from 'lucide-react';
import { BusinessFilters, getCities, getUserLocation, getFilterPresets } from '../../api/b2bApi';

interface AdvancedFiltersProps {
  filters: BusinessFilters;
  onFiltersChange: (filters: BusinessFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

interface City {
  id: number;
  name: string;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onApply,
  onClear
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Load cities for dropdown
    loadCities();
  }, []);

  const loadCities = async (search?: string) => {
    try {
      const citiesData = await getCities(search);
      setCities(citiesData);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const filterPresets = getFilterPresets();

  const presetOptions = [
    { key: 'verified_businesses', label: 'Verified Businesses', icon: Shield, color: 'green' },
    { key: 'marketplace_sellers', label: 'Marketplace Sellers', icon: Store, color: 'blue' },
    { key: 'high_credit_businesses', label: 'High Credit Limit', icon: DollarSign, color: 'purple' },
    { key: 'local_distributors', label: 'Distributors', icon: Building2, color: 'orange' },
    { key: 'new_businesses', label: 'New Businesses', icon: Star, color: 'pink' },
  ];

  const applyPreset = (presetKey: string) => {
    const preset = filterPresets[presetKey as keyof typeof filterPresets];
    onFiltersChange({ ...filters, ...preset });
  };

  const handleGetCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const position = await getUserLocation();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setUserLocation({ lat, lng });
      
      onFiltersChange({
        ...filters,
        latitude: lat,
        longitude: lng,
        radius_km: filters.radius_km || 25 // Default 25km radius
      });
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to get your location. Please ensure location access is enabled.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const businessTypes = [
    { value: 'distributor', label: 'Distributor' },
    { value: 'retailer', label: 'Retailer' },
    { value: 'wholesaler', label: 'Wholesaler' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'supplier', label: 'Supplier' },
  ];

  const sortingOptions = [
    { value: '-user__date_joined', label: 'Newest First' },
    { value: 'user__date_joined', label: 'Oldest First' },
    { value: 'user__first_name', label: 'Name A-Z' },
    { value: '-user__first_name', label: 'Name Z-A' },
    { value: '-credit_limit', label: 'Highest Credit Limit' },
    { value: 'credit_limit', label: 'Lowest Credit Limit' },
    { value: 'location__name', label: 'Location A-Z' },
  ];

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length;

  return (
    <div className="bg-white border-b shadow-sm">
      {/* Filter Toggle Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-gray-700 hover:text-orange-600 transition-colors"
        >
          <Filter className="w-5 h-5" />
          <span className="font-semibold">Advanced Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              {activeFiltersCount}
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="p-6 bg-gray-50/50 border-b">
          {/* Quick Filter Presets */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-orange-600" />
              <h4 className="text-sm font-semibold text-gray-700">Quick Filters</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {presetOptions.map(preset => {
                const IconComponent = preset.icon;
                const colorClasses = {
                  green: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
                  blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
                  purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
                  orange: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100',
                  pink: 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100'
                };
                
                return (
                  <button
                    key={preset.key}
                    onClick={() => applyPreset(preset.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium hover:scale-105 ${colorClasses[preset.color as keyof typeof colorClasses]}`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Business Type Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Building2 className="w-4 h-4" />
                Business Type
              </label>
              <select
                value={filters.business_type || ''}
                onChange={(e) => onFiltersChange({ ...filters, business_type: e.target.value || undefined })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
              >
                <option value="">All Types</option>
                {businessTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Verification Status */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Shield className="w-4 h-4" />
                Verification Status
              </label>
              <select
                value={filters.b2b_verified === undefined ? '' : filters.b2b_verified.toString()}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  b2b_verified: e.target.value === '' ? undefined : e.target.value === 'true'
                })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
              >
                <option value="">All Businesses</option>
                <option value="true">Verified Only</option>
                <option value="false">Unverified Only</option>
              </select>
            </div>

            

            {/* City Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="w-4 h-4" />
                Location (City)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search city..."
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    loadCities(e.target.value);
                  }}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
                {citySearch && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto z-10 shadow-lg">
                    {cities.map(city => (
                      <button
                        key={city.id}
                        onClick={() => {
                          onFiltersChange({ ...filters, city: city.id, city_name: city.name });
                          setCitySearch(city.name);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Geographic Distance Filter */}
            <div className="space-y-2 lg:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Target className="w-4 h-4" />
                Distance Filter
              </label>
              <div className="flex gap-3 items-center">
                <button
                  onClick={handleGetCurrentLocation}
                  disabled={loadingLocation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {loadingLocation ? 'Getting Location...' : 'Use Current Location'}
                </button>
                {userLocation && (
                  <>
                    <span className="text-sm text-gray-600">within</span>
                    <select
                      value={filters.radius_km || 25}
                      onChange={(e) => onFiltersChange({ ...filters, radius_km: parseInt(e.target.value) })}
                      className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                    >
                      <option value={5}>5 km</option>
                      <option value={10}>10 km</option>
                      <option value={25}>25 km</option>
                      <option value={50}>50 km</option>
                      <option value={100}>100 km</option>
                    </select>
                    <button
                      onClick={() => {
                        setUserLocation(null);
                        onFiltersChange({ 
                          ...filters, 
                          latitude: undefined, 
                          longitude: undefined, 
                          radius_km: undefined 
                        });
                      }}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Registration Date Range */}
            <div className="space-y-2 lg:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4" />
                Registration Date Range
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="date"
                  value={filters.registered_after || ''}
                  onChange={(e) => onFiltersChange({ ...filters, registered_after: e.target.value || undefined })}
                  className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={filters.registered_before || ''}
                  onChange={(e) => onFiltersChange({ ...filters, registered_before: e.target.value || undefined })}
                  className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                Activity Status
              </label>
              <select
                value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  is_active: e.target.value === '' ? undefined : e.target.value === 'true'
                })}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
              >
                <option value="">All Users</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="text-sm font-semibold text-orange-800 mb-2">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null && value !== '').map(([key, value]) => (
                  <span key={key} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    {key.replace('_', ' ')}: {value.toString()}
                    <button
                      onClick={() => onFiltersChange({ ...filters, [key]: undefined })}
                      className="ml-1 text-orange-500 hover:text-orange-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;