import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Phone, Mail, Shield, Car, Award, AlertCircle } from 'lucide-react';
import { getTransporterProfile, type TransporterProfile } from '../api/transporterApi';

const Skeleton = ({ className = '' }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
);

const Badge = ({ variant = 'default', className = '', children }) => {
  const baseStyles = 'inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold';
  const variantStyles = {
    default: 'bg-orange-500 text-white',
    secondary: 'bg-gray-500 text-white',
    outline: 'text-gray-600 border-gray-300',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

const StatCard = ({ label, value }) => (
  <div className="text-center p-2 bg-gray-50 rounded-lg">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-lg font-semibold text-gray-800">{value}</p>
  </div>
);

const TransporterProfile = () => {
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
      } catch (err) {
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
      <div className="container mx-auto p-4 text-center">
        <div className="text-red-500 mb-4">{error || 'Transporter not found'}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const stats = [
    { label: 'Total Deliveries', value: transporter.total_deliveries },
    { label: 'Success Rate', value: `${transporter.success_rate}%` },
    { label: 'Cancellation Rate', value: `${transporter.cancellation_rate}%` },
    { label: 'Earnings', value: `Rs. ${transporter.earnings_total}` },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <Card className="border-2 border-gray-200">
            <CardHeader className="items-center text-center p-4">
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                <span className="text-3xl text-orange-500">
                  {transporter.user.first_name[0]}{transporter.user.last_name[0]}
                </span>
              </div>
              <CardTitle className="text-xl text-orange-500">
                {transporter.user.first_name} {transporter.user.last_name}
              </CardTitle>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <Badge variant={transporter.is_available ? 'default' : 'secondary'}>
                  {transporter.is_available ? 'Available' : 'Not Available'}
                </Badge>
                <Badge variant={transporter.is_verified ? 'default' : 'outline'} className="gap-1">
                  {transporter.is_verified ? 'Verified' : 'Not Verified'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 truncate">{transporter.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{transporter.phone}</span>
                </div>
                {transporter.emergency_contact && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{transporter.emergency_contact}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">License: {transporter.license_number}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-orange-500 text-lg">
                <Car className="h-4 w-4 text-orange-500" /> Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-500">Vehicle Type</p>
                  <p className="font-medium">{transporter.vehicle_type_display}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle Number</p>
                  <p className="font-medium">{transporter.vehicle_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Capacity (kg)</p>
                  <p className="font-medium">{transporter.vehicle_capacity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service Radius</p>
                  <p className="font-medium">{transporter.service_radius} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-orange-500 text-lg">
                <Award className="h-4 w-4 text-orange-500" /> Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((stat, index) => (
                  <StatCard key={index} label={stat.label} value={stat.value} />
                ))}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Success Rate</span>
                  <span>{transporter.success_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${transporter.success_rate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Cancellation Rate</span>
                  <span>{transporter.cancellation_rate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" className="w-full sm:w-auto text-sm">
              Edit Profile
            </Button>
            <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-sm">
              Contact Transporter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TransporterProfileSkeleton = () => (
  <div className="container mx-auto px-4 py-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="items-center text-center p-4">
            <Skeleton className="h-24 w-24 rounded-full mb-3" />
            <Skeleton className="h-5 w-36 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="p-4">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default TransporterProfile;
