import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { AlertCircle, Clock, CheckCircle, Star, Package, TrendingUp, AlertTriangle, Users, Target, Timer } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { formatCurrency } from '../lib/utils';
import { getTransporterStats, type TransporterStats } from '../api/transporterApi';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  className = '',
  variant = 'default'
}) => {
  const variants = {
    default: 'border-l-gray-400 bg-gradient-to-br from-white to-gray-50',
    success: 'border-l-green-500 bg-gradient-to-br from-green-50/50 to-green-100/50',
    warning: 'border-l-yellow-500 bg-gradient-to-br from-yellow-50/50 to-yellow-100/50',
    info: 'border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-blue-100/50'
  };

  return (
    <Card className={`h-full border-l-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${variants[variant]} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between space-x-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1 break-words">{value}</h3>
            {description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>
            )}
          </div>
          <div className="flex-shrink-0 p-3 rounded-full bg-blue-100 text-blue-600">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProgressBar: React.FC<{
  value: number;
  color?: string;
  label: string;
  displayValue?: string;
  className?: string;
}> = ({ value, color = 'blue', label, displayValue, className = '' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    emerald: 'bg-emerald-500'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-700">
          {displayValue || `${Math.round(value)}%`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ease-out ${colorClasses[color] || colorClasses.blue}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
};

const StarRating: React.FC<{ rating: number; totalDeliveries: number }> = ({ rating, totalDeliveries }) => {
  const filledStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - filledStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center flex-wrap gap-2">
      <div className="flex items-center">
        {[...Array(filledStars)].map((_, i) => (
          <Star key={`filled-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-4 w-4 text-gray-200" />
            <div className="absolute left-0 top-0 w-1/2 h-full overflow-hidden">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-200" />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}</span>
      </div>
      <span className="text-sm text-gray-500">
        ({totalDeliveries} total)
      </span>
    </div>
  );
};

const TransporterEarnings: React.FC = () => {
  const [stats, setStats] = useState<TransporterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getTransporterStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching transporter stats:', err);
        setError('Failed to load earnings data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const renderStatCards = () => {
    if (!stats) return null;

    return (
      <>
        <StatCard
          title="Total Earnings"
          value={`Rs.${stats.total_earnings}`}
          icon={<TrendingUp className="w-5 h-5" />}
          description={`${stats.commission_rate}% commission rate`}
          variant="info"
          className="col-span-1"
        />
        <StatCard
          title="This Month"
          value={`Rs.${stats.earnings_this_month}`}
          icon={<Package className="w-5 h-5" />}
          description={`${stats.deliveries_this_month} deliveries`}
          variant="success"
          className="col-span-1"
        />
        <StatCard
          title="Active Deliveries"
          value={stats.active_deliveries}
          icon={<Clock className="w-5 h-5" />}
          description="Currently on the road"
          variant="warning"
          className="col-span-1"
        />
        <StatCard
          title="Success Rate"
          value={`${Math.round(stats.success_rate * 100)}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          description={`${stats.successful_deliveries} of ${stats.total_deliveries} deliveries`}
          variant="success"
          className="col-span-1"
        />
      </>
    );
  };

  const renderPerformanceCard = () => {
    if (!stats) return null;

    return (
      <Card className="h-full shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StarRating rating={stats.rating ?? 0} totalDeliveries={stats.total_deliveries} />

          <ProgressBar
            value={stats.success_rate * 100}
            color="green"
            label="Success Rate"
            displayValue={`${Math.round(stats.success_rate * 100)}%`}
          />

          <ProgressBar
            value={Math.min(100, (5 - stats.average_delivery_time) * 20)}
            color="blue"
            label="Speed Performance"
            displayValue={`${stats.average_delivery_time}h avg`}
          />
        </CardContent>
      </Card>
    );
  };

  const renderDeliveryStatsCard = () => {
    if (!stats) return null;

    return (
      <Card className="h-full shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Delivery Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-xl font-bold text-green-600">{stats.successful_deliveries}</p>
              <p className="text-xs text-gray-500">Successful</p>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold text-red-600">{stats.cancelled_deliveries}</p>
              <p className="text-xs text-gray-500">Cancelled</p>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold text-blue-600">{stats.total_deliveries}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
          <div className="space-y-4">
            <ProgressBar
              value={(stats.successful_deliveries / (stats.total_deliveries || 1)) * 100}
              color="green"
              label="Successful Deliveries"
              displayValue={stats.successful_deliveries.toString()}
            />

            <ProgressBar
              value={(stats.cancelled_deliveries / (stats.total_deliveries || 1)) * 100}
              color="red"
              label="Cancelled Deliveries"
              displayValue={stats.cancelled_deliveries.toString()}
            />
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Commission Rate</p>
                <p className="text-xs text-gray-500">Platform fee per delivery</p>
              </div>
              <span className="text-xl font-bold text-blue-600">{stats.commission_rate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-32 shadow-sm">
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-8 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-lg shadow-sm" />
          <Skeleton className="h-64 w-full rounded-lg shadow-sm" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col p-4">
        <main className="flex-grow">
          <Alert variant="destructive" className="mb-6 shadow-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      <main className="flex-grow space-y-6 max-w-7xl mx-auto w-full">
        {stats?.is_documents_expired && (
          <Alert variant="destructive" className="mb-6 shadow-sm">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Documents Expired</AlertTitle>
            <AlertDescription>
              Your documents have expired. Please update them in your profile to continue receiving delivery requests.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {renderStatCards()}
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {renderPerformanceCard()}
          {renderDeliveryStatsCard()}
        </div>
      </main>
    </div>
  );
};

export default TransporterEarnings;
