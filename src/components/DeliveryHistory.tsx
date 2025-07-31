import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  MapPin,
  RefreshCw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getDeliveryHistory, type Delivery } from '../api/transporterApi';
import { formatCurrency } from '../lib/utils';

interface DeliveryHistoryProps {
  className?: string;
}

interface DeliveryStats {
  totalEarnings: number;
  totalDeliveries: number;
  averageEarnings: number;
  completionRate: number;
}

interface Pagination {
  count: number;
  next: string | null;
  previous: string | null;
  currentPage: number;
  totalPages: number;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  status: string;
  searchTerm: string;
}

const ITEMS_PER_PAGE = 20;
const MAX_RETRIES = 3;

const statusConfig = {
  pending: { 
    icon: <Clock className="h-4 w-4 text-yellow-500" />, 
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Pending'
  },
  in_progress: { 
    icon: <Clock className="h-4 w-4 text-blue-500" />, 
    color: 'bg-blue-100 text-blue-800',
    label: 'In Progress'
  },
  completed: { 
    icon: <CheckCircle className="h-4 w-4 text-green-500" />, 
    color: 'bg-green-100 text-green-800',
    label: 'Completed'
  },
  cancelled: { 
    icon: <XCircle className="h-4 w-4 text-red-500" />, 
    color: 'bg-red-100 text-red-800',
    label: 'Cancelled'
  },
  failed: { 
    icon: <XCircle className="h-4 w-4 text-red-500" />, 
    color: 'bg-red-100 text-red-800',
    label: 'Failed'
  },
} as const;

const DeliveryHistory: React.FC<DeliveryHistoryProps> = ({ className }) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    searchTerm: '',
  });

  const [pagination, setPagination] = useState<Pagination>({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1,
  });

  const stats = useMemo((): DeliveryStats => {
    const totalDeliveries = deliveries.length;
    const totalEarnings = deliveries.reduce((sum, delivery) => 
      sum + parseFloat(delivery.delivery_fee || '0'), 0
    );
    const completedDeliveries = deliveries.filter(d => d.status === 'completed').length;
    
    return {
      totalEarnings,
      totalDeliveries,
      averageEarnings: totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0,
      completionRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0,
    };
  }, [deliveries]);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const buildQueryParams = useCallback(() => {
    const params: Record<string, string> = {};
    
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.status !== 'all') params.status = filters.status;
    if (filters.searchTerm.trim()) params.search = filters.searchTerm.trim();
    
    return params;
  }, [filters]);

  const fetchDeliveryHistory = useCallback(async (page = 1, showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const queryParams = buildQueryParams();
      const data = await getDeliveryHistory({
        ...queryParams,
        page,
        limit: ITEMS_PER_PAGE,
      });

      setDeliveries(data.results || []);
      setPagination({
        count: data.pagination?.count || 0,
        next: data.pagination?.next || null,
        previous: data.pagination?.previous || null,
        currentPage: page,
        totalPages: Math.ceil((data.pagination?.count || 0) / ITEMS_PER_PAGE),
      });
      
      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching delivery history:', err);
      
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchDeliveryHistory(page, showRefresh), 1000 * Math.pow(2, retryCount));
      } else {
        setError('Failed to load delivery history. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [buildQueryParams, retryCount]);

  useEffect(() => {
    fetchDeliveryHistory(1);
  }, [filters.dateFrom, filters.dateTo, filters.status]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.searchTerm !== '') {
        fetchDeliveryHistory(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters.searchTerm, fetchDeliveryHistory]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    fetchDeliveryHistory(1);
  }, [fetchDeliveryHistory]);

  const handleRefresh = useCallback(() => {
    fetchDeliveryHistory(pagination.currentPage, true);
  }, [fetchDeliveryHistory, pagination.currentPage]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchDeliveryHistory(newPage);
    }
  }, [fetchDeliveryHistory, pagination.totalPages]);

  const formatDate = useCallback((dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      status: 'all',
      searchTerm: '',
    });
  }, []);

  const renderStatusBadge = useCallback((delivery: Delivery) => {
    const config = statusConfig[delivery.status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        <span className="ml-1">{delivery.status_display || config.label}</span>
      </span>
    );
  }, []);

  const renderStatsCard = useCallback((title: string, value: string | number, subtitle: string) => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  ), []);

  if (error && !deliveries.length) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">Unable to Load Delivery History</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fetchDeliveryHistory(1)} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Delivery History</h2>
          <p className="text-muted-foreground">
            Track your deliveries and earnings over time
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filters & Summary</span>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                  max={filters.dateTo}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilters({ dateTo: e.target.value })}
                  min={filters.dateFrom}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => updateFilters({ status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Delivery ID, tracking..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                />
              </div>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderStatsCard(
              'Total Deliveries',
              stats.totalDeliveries.toLocaleString(),
              'All time deliveries'
            )}
            {renderStatsCard(
              'Total Earnings',
              formatCurrency(stats.totalEarnings),
              'All time earnings'
            )}
            {renderStatsCard(
              'Average Earnings',
              stats.averageEarnings > 0 ? formatCurrency(stats.averageEarnings) : 'N/A',
              'Per delivery'
            )}
            {renderStatsCard(
              'Completion Rate',
              `${stats.completionRate.toFixed(1)}%`,
              'Successfully completed'
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Delivery Records</span>
            {pagination.count > 0 && (
              <span className="text-sm text-muted-foreground">
                {((pagination.currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(pagination.currentPage * ITEMS_PER_PAGE, pagination.count)} of {pagination.count}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Loading deliveries...</span>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Deliveries Found</h3>
              <p className="text-gray-500 mb-4">
                {filters.searchTerm || filters.status !== 'all' || filters.dateFrom || filters.dateTo
                  ? 'Try adjusting your filters to see more results.'
                  : 'Start making deliveries to see your history here.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b">
                      <th className="pb-3 px-4 font-medium">Delivery Info</th>
                      <th className="pb-3 px-4 font-medium">Date & Time</th>
                      <th className="pb-3 px-4 font-medium">Route</th>
                      <th className="pb-3 px-4 text-right font-medium">Earnings</th>
                      <th className="pb-3 px-4 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {deliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{delivery.delivery_id}</div>
                          {delivery.tracking_number && (
                            <div className="text-xs text-muted-foreground">{delivery.tracking_number}</div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium">{formatDate(delivery.created_at)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(delivery.created_at)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="max-w-[200px]">
                            <div className="text-sm font-medium truncate" title={delivery.pickup_address}>
                              <MapPin className="h-4 w-4 inline mr-1 text-yellow-500" /> {delivery.pickup_address}
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-1" title={delivery.delivery_address}>
                              <MapPin className="h-4 w-4 inline mr-1 text-green-500" /> {delivery.delivery_address}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(parseFloat(delivery.delivery_fee || '0'))}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {renderStatusBadge(delivery)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.previous || isLoading}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.next || isLoading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryHistory;
