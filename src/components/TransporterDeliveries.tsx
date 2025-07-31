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
  ChevronsRight,
  Loader2,
  MapPin as PinIcon,
  User,
  Info,
  Package2,
  Clock as ClockIcon,
  Phone,
  FileText,
  Camera,
  AlertCircle,
  DollarSign,
  Ruler,
  Weight,
  Navigation,
  Shield,
  Target,
  Timer,
  Activity
} from 'lucide-react';
import { getTransporterDeliveries, getDeliveryDetail, type Delivery, type DeliveryDetail, type PaginatedResponse } from '../api/transporterApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

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
  const [offset, setOffset] = useState(0);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryDetail | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [limit, setLimit] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    setOffset(0); 
  };

  const totalPages = deliveriesData ? Math.ceil(deliveriesData.count / limit) : 0;
  const deliveries = deliveriesData?.results || [];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = async (deliveryId: string) => {
    try {
      setIsDetailsLoading(true);
      const details = await getDeliveryDetail(deliveryId);
      setSelectedDelivery(details);
      setIsDetailsOpen(true);
    } catch (error: any) {
      console.error('Error fetching delivery details:', error);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedDelivery(null);
  };

  const DeliveryDetailsDialog = () => {
    if (!selectedDelivery) return null;

    return (
      <Dialog open={isDetailsOpen} onOpenChange={closeDetails} modal={true}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package2 className="h-5 w-5" />
              <span>Delivery Details - #{selectedDelivery.delivery_id}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status and Priority Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {statusIcons[selectedDelivery.status as keyof typeof statusIcons]}
                  <span className="font-medium">{selectedDelivery.status_display}</span>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  priorityColors[selectedDelivery.priority as keyof typeof priorityColors]
                }`}>
                  {selectedDelivery.priority_display}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="font-mono font-medium">{selectedDelivery.tracking_number}</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Order Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium">{selectedDelivery.marketplace_sale.order_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium">{formatDateTime(selectedDelivery.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Updated At</p>
                  <p className="font-medium">{formatDateTime(selectedDelivery.updated_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Delivery Attempts</p>
                  <p className="font-medium">{selectedDelivery.delivery_attempts} / {selectedDelivery.max_delivery_attempts}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-600">
                    <MapPin className="h-4 w-4" />
                    <span>Pickup Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{selectedDelivery.pickup_address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        Contact Name
                      </p>
                      <p className="font-medium">{selectedDelivery.pickup_contact_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        Phone
                      </p>
                      <p className="font-medium">{selectedDelivery.pickup_contact_phone}</p>
                    </div>
                  </div>
                  {selectedDelivery.pickup_instructions && (
                    <div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        Instructions
                      </p>
                      <p className="text-sm bg-gray-50 p-2 rounded">{selectedDelivery.pickup_instructions}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Requested Date</p>
                      <p className="font-medium">{formatDate(selectedDelivery.requested_pickup_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Actual Pickup</p>
                      <p className="font-medium">{formatDateTime(selectedDelivery.picked_up_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-600">
                    <Target className="h-4 w-4" />
                    <span>Delivery Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{selectedDelivery.delivery_address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        Contact Name
                      </p>
                      <p className="font-medium">{selectedDelivery.delivery_contact_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        Phone
                      </p>
                      <p className="font-medium">{selectedDelivery.delivery_contact_phone}</p>
                    </div>
                  </div>
                  {selectedDelivery.delivery_instructions && (
                    <div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        Instructions
                      </p>
                      <p className="text-sm bg-gray-50 p-2 rounded">{selectedDelivery.delivery_instructions}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Requested Date</p>
                      <p className="font-medium">{formatDate(selectedDelivery.requested_delivery_date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Delivered At</p>
                      <p className="font-medium">{formatDateTime(selectedDelivery.delivered_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>Package Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Weight className="h-3 w-3 mr-1" />
                    Weight
                  </p>
                  <p className="font-medium">{selectedDelivery.package_weight} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Ruler className="h-3 w-3 mr-1" />
                    Dimensions
                  </p>
                  <p className="font-medium">{selectedDelivery.package_dimensions || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Value
                  </p>
                  <p className="font-medium">Rs. {selectedDelivery.package_value || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fragile</p>
                  <div className="flex items-center space-x-1">
                    {selectedDelivery.fragile ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-orange-600">Yes</span>
                      </>
                    ) : (
                      <span className="font-medium text-green-600">No</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Requires Signature
                  </p>
                  <p className="font-medium">{selectedDelivery.requires_signature ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Navigation className="h-3 w-3 mr-1" />
                    Distance
                  </p>
                  <p className="font-medium">{selectedDelivery.distance_km || 'N/A'} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Timer className="h-3 w-3 mr-1" />
                    Est. Delivery Time
                  </p>
                  <p className="font-medium">{selectedDelivery.estimated_delivery_time || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Activity className="h-3 w-3 mr-1" />
                    Success Rate
                  </p>
                  <p className="font-medium">{selectedDelivery.success_rate}%</p>
                </div>
              </CardContent>
            </Card>

            {selectedDelivery.special_instructions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Special Instructions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                    {selectedDelivery.special_instructions}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Financial Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Delivery Fee</p>
                  <p className="font-medium text-lg">Rs. {selectedDelivery.delivery_fee}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fuel Surcharge</p>
                  <p className="font-medium">Rs. {selectedDelivery.fuel_surcharge || '0'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-medium text-lg text-green-600">
                    Rs. {(parseFloat(selectedDelivery.delivery_fee) + parseFloat(selectedDelivery.fuel_surcharge || '0')).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Created</p>
                      <p className="text-sm text-gray-500">{formatDateTime(selectedDelivery.created_at)}</p>
                    </div>
                  </div>
                  {selectedDelivery.assigned_at && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Assigned</p>
                        <p className="text-sm text-gray-500">{formatDateTime(selectedDelivery.assigned_at)}</p>
                      </div>
                    </div>
                  )}
                  {selectedDelivery.picked_up_at && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Picked Up</p>
                        <p className="text-sm text-gray-500">{formatDateTime(selectedDelivery.picked_up_at)}</p>
                      </div>
                    </div>
                  )}
                  {selectedDelivery.delivered_at && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Delivered</p>
                        <p className="text-sm text-gray-500">{formatDateTime(selectedDelivery.delivered_at)}</p>
                      </div>
                    </div>
                  )}
                  {selectedDelivery.cancelled_at && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Cancelled</p>
                        <p className="text-sm text-gray-500">{formatDateTime(selectedDelivery.cancelled_at)}</p>
                        {selectedDelivery.cancellation_reason && (
                          <p className="text-sm text-red-600">Reason: {selectedDelivery.cancellation_reason}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {(selectedDelivery.delivery_notes || selectedDelivery.delivery_photo || selectedDelivery.signature_image) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="h-4 w-4" />
                    <span>Delivery Proof</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedDelivery.delivery_notes && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Delivery Notes</p>
                      <p className="text-sm bg-gray-50 p-3 rounded">{selectedDelivery.delivery_notes}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDelivery.delivery_photo && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Delivery Photo</p>
                        <img 
                          src={selectedDelivery.delivery_photo} 
                          alt="Delivery proof" 
                          className="w-full h-48 object-cover rounded border"
                        />
                      </div>
                    )}
                    {selectedDelivery.signature_image && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Signature</p>
                        <img 
                          src={selectedDelivery.signature_image} 
                          alt="Delivery signature" 
                          className="w-full h-48 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-2">
              {selectedDelivery.is_overdue && (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Overdue
                </span>
              )}
              {selectedDelivery.time_since_pickup && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  Time since pickup: {selectedDelivery.time_since_pickup}
                </span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
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
          <Card key={delivery.id} className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-yellow-500">
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

              <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-sm bg">
                <div className="flex items-center text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Requested for {formatDate(delivery.requested_delivery_date)}</span>
                </div>
                <div className="flex space-x-2 border-l-4 border-yellow-500">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(delivery.delivery_id)}
                    disabled={isDetailsLoading}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    {isDetailsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : 'View Details'}
                  </Button>
                  {delivery.status === 'pending' && (
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      Accept Delivery
                    </Button>
                  )}
                  {delivery.status === 'in_progress' && (
                    <Button size="sm" variant="secondary" className="bg-yellow-600 hover:bg-yellow-700">
                      Update Status
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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

      <DeliveryDetailsDialog />
    </div>
  );
};

export default TransporterDeliveries;
