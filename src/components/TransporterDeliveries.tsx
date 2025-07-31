import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  MapPin, 
  Truck, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { getTransporterDeliveries, type Delivery, type PaginatedResponse } from '../api/transporterApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const statusIcons = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  in_progress: <Truck className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-500" />,
  failed: <AlertTriangle className="h-4 w-4 text-orange-500" />,
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const TransporterDeliveries: React.FC = () => {
  const [deliveriesData, setDeliveriesData] = useState<PaginatedResponse<Delivery> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const fetchDeliveries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTransporterDeliveries(limit, offset);
        setDeliveriesData(data);
      } catch (err: any) {
        setError('Failed to load deliveries. Please try again later.');
        console.error('Error fetching deliveries:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveries();
  }, [limit, offset]);

  const handlePageSizeChange = (value: string) => {
    setLimit(Number(value));
    setOffset(0); // Reset to first page when changing page size
  };

  const totalPages = deliveriesData ? Math.ceil(deliveriesData.count / limit) : 0;
  const deliveries = deliveriesData?.results || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!isLoading && !error && (!deliveries || deliveries.length === 0)) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No deliveries</h3>
        <p className="mt-1 text-sm text-gray-500">You don't have any deliveries assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">My Deliveries</h2>
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{deliveries.length}</span> deliveries
        </div>
      </div>

      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <Card key={delivery.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-gray-500" />
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

              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Package Weight</p>
                  <p className="font-medium">{delivery.package_weight} kg</p>
                </div>
                <div>
                  <p className="text-gray-500">Distance</p>
                  <p className="font-medium">{delivery.distance_km} km</p>
                </div>
                <div>
                  <p className="text-gray-500">Delivery Fee</p>
                  <p className="font-medium">Rs. {delivery.delivery_fee}</p>
                </div>
                <div>
                  <p className="text-gray-500">Fragile</p>
                  <p className="font-medium">{delivery.fragile ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex items-center text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Requested for {formatDate(delivery.requested_delivery_date)}</span>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {delivery.status === 'pending' && (
                    <Button size="sm">
                      Accept Delivery
                    </Button>
                  )}
                  {delivery.status === 'in_progress' && (
                    <Button size="sm" variant="secondary">
                      Update Status
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {deliveriesData && deliveriesData.count > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 border-t">
          <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
            Showing <span className="font-medium">{(offset / limit) + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(offset + limit, deliveriesData.count)}
            </span>{' '}
            of <span className="font-medium">{deliveriesData.count}</span> deliveries
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setOffset(0)}
              disabled={offset === 0 || isLoading}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setOffset(offset => Math.max(0, offset - limit))}
              disabled={offset === 0 || isLoading}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-center w-8 h-8 text-sm font-medium">
              {offset / limit + 1}
            </div>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setOffset(offset => Math.min(totalPages, offset + limit))}
              disabled={offset >= totalPages || isLoading}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setOffset(totalPages)}
              disabled={offset >= totalPages || isLoading}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransporterDeliveries;
