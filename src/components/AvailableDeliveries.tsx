import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Package, MapPin, Clock, DollarSign, CheckCircle, Map } from 'lucide-react';
import { getAvailableDeliveries } from '../api/transporterApi';
import type { Delivery } from '../api/transporterApi';
import { Skeleton } from './ui/skeleton';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

const statusIcons = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  in_transit: <Package className="h-4 w-4 text-blue-500" />,
  delivered: <CheckCircle className="h-4 w-4 text-green-500" />,
  cancelled: <Clock className="h-4 w-4 text-red-500" />,
};

const AvailableDeliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const limit = 10;

  const loadDeliveries = async (reset = false) => {
    try {
      setIsLoading(true);
      const currentOffset = reset ? 0 : offset;
      const data = await getAvailableDeliveries({
        limit,
        offset: currentOffset,
        sort_by: 'pickup_date',
        sort_order: 'asc'
      });
      
      setDeliveries(prev => reset ? data.results : [...prev, ...data.results]);
      setHasMore(!!data.next);
      if (!reset) setOffset(currentOffset + limit);
    } catch (error: any) {
      setError('Failed to load available deliveries. Please try again later.');
      console.error('Error loading deliveries:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available deliveries',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries(true);
  }, []);

  const handleClaimDelivery = async (deliveryId: string) => {
    try {
      toast({
        title: 'Success',
        description: 'Delivery claimed successfully!',
      });
      loadDeliveries(true);
    } catch (error) {
      console.error('Error claiming delivery:', error);
      toast({
        title: 'Error',
        description: 'Failed to claim delivery. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading && deliveries.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="bg-gray-50 px-6 py-4 border-b">
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Skeleton className="h-4 w-1/4 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div>
                  <Skeleton className="h-4 w-1/4 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              <Skeleton className="h-10 w-32 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => loadDeliveries(true)}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No deliveries available</h3>
        <p className="mt-1 text-gray-500">There are currently no deliveries available. Please check back later.</p>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Available Deliveries</h2>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/deliveries/nearby')}
            className="flex items-center gap-2"
          >
            <Map className="h-4 w-4" />
            Show Nearby
          </Button>
          <div className="text-sm text-gray-500 whitespace-nowrap">
            Showing <span className="font-medium">{deliveries.length}</span> deliveries
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <Card key={delivery.id} className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-blue-500">
            <CardHeader className="px-6 py-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg font-medium">
                      Delivery #{delivery.delivery_id}
                    </CardTitle>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Order: {delivery.marketplace_sale.order_id}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    priorityColors[delivery.priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {delivery.priority_display}
                  </span>
                  <span className="flex items-center text-sm text-gray-500">
                    {statusIcons[delivery.status as keyof typeof statusIcons] || statusIcons.pending}
                    <span className="ml-1">{delivery.status_display}</span>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" /> Pickup
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">{delivery.pickup_address}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" /> Delivery
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">{delivery.delivery_address}</p>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-500">Pickup by:</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {new Date(delivery.requested_pickup_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-500">Weight:</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {delivery.package_weight} kg
                  </span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-500">Earnings:</span>
                  <span className="ml-1 font-medium text-gray-900">
                    Rs.{parseFloat(delivery.delivery_fee).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={() => handleClaimDelivery(delivery.delivery_id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Claim Delivery
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => loadDeliveries()}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AvailableDeliveries;
