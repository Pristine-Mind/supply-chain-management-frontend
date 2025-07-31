import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Package, Clock, DollarSign, AlertCircle, Navigation, Weight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { Delivery } from './CheckoutScreen';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const createCustomIcon = (color: string, priority: string) => {
  return L.divIcon({
    className: 'custom-delivery-marker',
    html: `
      <div style="
        background: ${color}; 
        border-radius: 50%; 
        width: 32px; 
        height: 32px; 
        border: 3px solid white; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      ">📦</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="
        background: #3b82f6; 
        border-radius: 50%; 
        width: 28px; 
        height: 28px; 
        border: 3px solid white; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">📍</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

const DeliveryMap = ({ deliveries, center }: { deliveries: Delivery[], center: { lat: number, lng: number } }) => {
  const priorityColors = {
    high: '#ef4444',    // Red
    medium: '#f59e0b',  // Yellow
    normal: '#3b82f6',  // Blue
    low: '#10b981'      // Green
  };

  const mapCenter = center ? [center.lat, center.lng] : [27.7172, 85.3240];
  
  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      
      <Marker 
        position={mapCenter}
        icon={createUserIcon()}
      >
        <Popup>
          <div className="text-center p-2">
            <strong className="text-blue-600">Your Location</strong>
            <br />
            <small className="text-gray-500">
              {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}
            </small>
          </div>
        </Popup>
      </Marker>
      
      {deliveries.map((delivery) => {
        if (!delivery.pickup_latitude || !delivery.pickup_longitude) return null;
        
        const position = [
          parseFloat(delivery.pickup_latitude), 
          parseFloat(delivery.pickup_longitude)
        ];
        
        const priority = delivery.priority?.toLowerCase() || 'normal';
        const color = priorityColors[priority] || priorityColors.normal;
        
        return (
          <Marker
            key={delivery.id}
            position={position}
            icon={createCustomIcon(color, priority)}
          >
            <Popup maxWidth={300} className="custom-popup">
              <div className="p-2">
                <div className="font-semibold text-lg mb-2 text-gray-800">
                  #{delivery.tracking_number}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Pickup:</span>
                      <div className="text-gray-600">{delivery.pickup_address}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Delivery:</span>
                      <div className="text-gray-600">{delivery.delivery_address}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Navigation className="h-3 w-3 text-blue-500" />
                      <span className="text-xs">{delivery.distance_km}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-medium text-green-600">
                        NPR {parseFloat(delivery.delivery_fee).toFixed(0)}
                      </span>
                    </div>
                    
                    {delivery.package_weight && (
                      <div className="flex items-center gap-1">
                        <Weight className="h-3 w-3 text-gray-500" />
                        <span className="text-xs">{parseFloat(delivery.package_weight).toFixed(1)} kg</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white`} 
                            style={{backgroundColor: color}}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  {delivery.fragile && (
                    <div className="text-xs text-orange-600 font-medium">⚠️ Fragile Package</div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

const getNearbyDeliveries = async (radius = 10) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/deliveries/nearby/?radius=${radius}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw errorData || `HTTP error! status: ${response.status}`;
    }
    
    const data = await response.json();
    return data.results || data;
  } catch (error) {
    console.error('Error fetching nearby deliveries:', error);
    throw error;
  }
};

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
};

const Button = ({ children, variant = 'default', size = 'md', className = '', onClick, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'hover:bg-gray-100 hover:text-gray-900',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50'
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-11 px-6'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const NearbyDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(10);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    getCurrentLocation()
      .then(location => {
        setUserLocation(location);
      })
      .catch(error => {
        console.error('Error getting location:', error);
        setLocationError('Unable to get your location. Using default location.');
        setUserLocation({ lat: 27.7172, lng: 85.3240 });
      });
  }, []);

  useEffect(() => {
    const fetchNearbyDeliveries = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getNearbyDeliveries(radius);
        
        const filteredDeliveries = data.filter(delivery => {
          const distanceKm = delivery.distance / 1000; 
          return distanceKm >= radius;
        });
        
        setDeliveries(filteredDeliveries);
        
      } catch (err) {
        console.error('Error fetching nearby deliveries:', err);
        setError(typeof err === 'string' ? err : 'Failed to load nearby deliveries. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearbyDeliveries();
  }, [radius]);

  const formatDistance = (distance) => {
    if (!distance && distance !== 0) return 'Unknown';
    const distanceKm = distance / 1000;   
    return distanceKm < 1 
      ? `${distance.toFixed(0)} m` 
      : `${distanceKm.toFixed(1)} km`;
  };

  const getPriorityBadge = (priority) => {
    if (!priority) return null;
    
    const priorityClasses = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      normal: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-green-100 text-green-800 border-green-200',
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full border ${priorityClasses[priority.toLowerCase()] || 'bg-gray-100 border-gray-200'}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount);
    return `NPR ${numAmount.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Nearby Deliveries</h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-96 w-full" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Nearby Deliveries</h1>
        </div>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-2 space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    setRadius(prev => prev);
                  }}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mapCenter = userLocation || 
    (deliveries.length > 0 && deliveries[0].pickup_latitude && deliveries[0].pickup_longitude
      ? { 
          lat: parseFloat(deliveries[0].pickup_latitude), 
          lng: parseFloat(deliveries[0].pickup_longitude) 
        }
      : { lat: 27.7172, lng: 85.3240 }); 

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.history.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Nearby Deliveries</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="radius" className="text-sm font-medium">
              Radius:
            </label>
            <select
              id="radius"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {deliveries.length} deliveries found
          </div>
        </div>
      </div>

      {locationError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{locationError}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Delivery Locations Map
        </h2>
        <div className="h-96 bg-gray-50 rounded-lg border overflow-hidden">
          <DeliveryMap deliveries={deliveries} center={mapCenter} />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-green-600" />
          Available Deliveries in Your Area
        </h2>
        
        {deliveries.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
            <p className="text-gray-600 mb-4">
              There are no available deliveries within {radius} km of your location.
            </p>
            <Button onClick={() => setRadius(radius + 10)} variant="outline">
              Expand search to {radius + 10} km
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div 
                key={delivery.id} 
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-blue-300"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        #{delivery.tracking_number}
                      </h3>
                      {delivery.priority && getPriorityBadge(delivery.priority)}
                      {delivery.fragile && (
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 border border-orange-200 rounded-full">
                          Fragile
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-blue-500" />
                        <span>{delivery.distance_km} away</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-green-600">
                          {formatCurrency(delivery.delivery_fee)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-gray-500" />
                        <span>{delivery.package_weight ? `${parseFloat(delivery.package_weight).toFixed(1)} kg` : 'Not specified'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(delivery.requested_pickup_date)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Pickup:</span>
                          <span className="ml-1 text-gray-600">{delivery.pickup_address || 'Address not provided'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Delivery:</span>
                          <span className="ml-1 text-gray-600">{delivery.delivery_address || 'Address not provided'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {delivery.marketplace_sale && (
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        <div>Order: {delivery.marketplace_sale.order_number}</div>
                        <div>Customer: {delivery.marketplace_sale.buyer_name}</div>
                        <div>Product: {delivery.marketplace_sale.product_name}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button 
                      variant="default" 
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => {
                        alert(`Viewing details for delivery ${delivery.tracking_number}`);
                      }}
                    >
                      View Details
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => {
                        alert(`Accepting job for delivery ${delivery.tracking_number}`);
                      }}
                    >
                      Accept Job
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Tracking: {delivery.tracking_number}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Priority: {delivery.priority_display || delivery.priority || 'Not specified'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyDeliveries;
