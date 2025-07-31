import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Phone, Mail, Shield, Car, Award, AlertCircle } from 'lucide-react';
import { getTransporterProfile, type TransporterProfile } from '../api/transporterApi';

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 animate-pulse ${className}`} />
);

const Badge = ({ 
  variant = 'default', 
  className = '',
  children 
}: { 
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
  children: React.ReactNode;
}) => {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80 border-transparent',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent',
    outline: 'text-foreground border-border',
  };
  
  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

const TransporterProfile: React.FC = () => {
  const [transporter, setTransporter] = useState<TransporterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransporterData = async () => {      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getTransporterProfile();
        setTransporter(data);
      } catch (err: any) {
        setError('Failed to load transporter profile. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransporterData();
  }, []);

  if (isLoading) {
    return <TransporterProfileSkeleton />;
  }

  if (error || !transporter) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <div className="text-red-500 mb-4">{error || 'Transporter not found'}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const stats = [
    { label: 'Total Deliveries', value: transporter.total_deliveries },
    { label: 'Success Rate', value: `${transporter.success_rate}%` },
    { label: 'Cancellation Rate', value: `${transporter.cancellation_rate}%` },
    { label: 'Earnings', value: `Rs.${transporter.earnings_total}` },
  ];

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="h-full border-2 border-gray-200">
            <CardHeader className="items-center text-center p-4 md:p-6">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-gray-200 flex items-center justify-center mb-3 md:mb-4">
                <span className="text-2xl md:text-4xl text-orange-500">
                  {transporter.user.first_name[0]}{transporter.user.last_name[0]}
                </span>
              </div>
              <CardTitle className="text-xl md:text-2xl text-orange-500">
                {transporter.user.first_name} {transporter.user.last_name}
              </CardTitle>
              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                <Badge variant={transporter.is_available ? 'default' : 'secondary'}>
                  {transporter.is_available ? 'Available' : 'Not Available'}
                </Badge>
                <Badge variant={transporter.is_verified ? 'default' : 'outline'} className="gap-1">
                  {transporter.is_verified ? 'Verified' : 'Not Verified'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-xs md:text-sm text-gray-600 truncate">{transporter.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-xs md:text-sm text-gray-600">{transporter.phone}</span>
                </div>
                {transporter.emergency_contact && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-xs md:text-sm text-gray-600">{transporter.emergency_contact}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-xs md:text-sm text-gray-600">License: {transporter.license_number}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-orange-500 text-lg md:text-xl">
                <Car className="h-4 w-4 md:h-5 md:w-5 text-orange-500" /> Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Vehicle Type</p>
                  <p className="font-medium text-sm md:text-base">{transporter.vehicle_type_display}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Vehicle Number</p>
                  <p className="font-medium text-sm md:text-base">{transporter.vehicle_number}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Capacity (kg)</p>
                  <p className="font-medium text-sm md:text-base">{transporter.vehicle_capacity}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Service Radius</p>
                  <p className="font-medium text-sm md:text-base">{transporter.service_radius} km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-orange-500 text-lg md:text-xl">
                <Award className="h-4 w-4 md:h-5 md:w-5 text-orange-500" /> Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs md:text-sm text-gray-500">{stat.label}</p>
                    <p className="text-lg md:text-xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 md:mt-4">
                <div className="flex justify-between text-xs md:text-sm text-gray-500 mb-1">
                  <span>Success Rate</span>
                  <span>{transporter.success_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 md:h-2.5">
                  <div 
                    className="bg-green-500 h-2 md:h-2.5 rounded-full" 
                    style={{ width: `${transporter.success_rate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs md:text-sm text-gray-500 mt-1">
                  <span>Cancellation Rate</span>
                  <span>{transporter.cancellation_rate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="outline" className="w-full sm:w-auto">
              Edit Profile
            </Button>
            <Button className="w-full sm:w-auto">
              Contact Transporter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TransporterProfileSkeleton = () => (
  <div className="container mx-auto px-2 sm:px-4 py-4 md:py-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="items-center text-center p-4 md:p-6">
            <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full mb-3 md:mb-4" />
            <Skeleton className="h-5 md:h-6 w-36 md:w-48 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-4 md:h-5 w-16 md:w-20" />
              <Skeleton className="h-4 md:h-5 w-20 md:w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24 md:w-32" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4 md:space-y-6">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <Skeleton className="h-5 md:h-6 w-36 md:w-48" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-20 md:w-24 mb-1 md:mb-2" />
                  <Skeleton className="h-4 md:h-5 w-24 md:w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <Skeleton className="h-5 md:h-6 w-24 md:w-32" />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 md:h-20 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default TransporterProfile;
