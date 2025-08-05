import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Phone, Mail, Shield, Car, Award, AlertCircle } from 'lucide-react';
import { getTransporterProfile, updateTransporterProfile, type TransporterProfile, type UpdateTransporterProfileData, type DocumentPreview } from '../api/transporterApi';

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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateTransporterProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    emergency_contact: '',
    vehicle_number: '',
    vehicle_capacity: '',
    service_radius: 0,
    verification_documents: [],
  });
  
  const [vehicleImagePreview, setVehicleImagePreview] = useState<string | null>(null);
  const [documentPreviews, setDocumentPreviews] = useState<DocumentPreview[]>([]);

  useEffect(() => {
    const fetchTransporterData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getTransporterProfile();
        setTransporter(data);
        setFormData({
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          email: data.user.email,
          phone: data.phone,
          emergency_contact: data.emergency_contact || '',
          vehicle_number: data.vehicle_number,
          vehicle_capacity: data.vehicle_capacity,
          service_radius: data.service_radius,
          verification_documents: [],
        });
        
        if (data.vehicle_image) {
          setVehicleImagePreview(data.vehicle_image);
        }
      } catch (err) {
        setError('Failed to load transporter profile. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransporterData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (e.target.name === 'vehicle_image') {
        setFormData(prev => ({
          ...prev,
          vehicle_image: file
        }));
        setVehicleImagePreview(URL.createObjectURL(file));
      } else if (e.target.name === 'verification_documents' && e.target.files) {
        const newFiles = Array.from(e.target.files);
        const newPreviews = newFiles.map(file => ({
          file,
          preview: URL.createObjectURL(file)
        }));
        
        setFormData(prev => ({
          ...prev,
          verification_documents: [...(prev.verification_documents || []), ...newFiles]
        }));
        
        setDocumentPreviews(prev => [...prev, ...newPreviews]);
      }
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      verification_documents: prev.verification_documents?.filter((_, i) => i !== index) || []
    }));
    setDocumentPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].preview);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  useEffect(() => {
    return () => {
      if (vehicleImagePreview) {
        URL.revokeObjectURL(vehicleImagePreview);
      }
      documentPreviews.forEach(preview => URL.revokeObjectURL(preview.preview));
    };
  }, [vehicleImagePreview, documentPreviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transporter) return;
    
    setIsLoading(true);
    try {
      const updatedData = await updateTransporterProfile(formData);
      setTransporter(updatedData);
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (!transporter) {
      setIsEditing(false);
      return;
    }
    
    setFormData({
      first_name: transporter.user?.first_name || '',
      last_name: transporter.user?.last_name || '',
      email: transporter.user?.email || '',
      phone: transporter.phone || '',
      emergency_contact: transporter.emergency_contact || '',
      vehicle_number: transporter.vehicle_number || '',
      vehicle_capacity: transporter.vehicle_capacity || '',
      service_radius: transporter.service_radius || 0,
    });
    
    setIsEditing(false);
  };

  if (isLoading && !isEditing) {
    return <TransporterProfileSkeleton />;
  }

  if ((error && !isEditing) || (!transporter && !isEditing)) {
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



  const renderEditForm = () => (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-orange-500">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                <input
                  type="tel"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                <input
                  type="text"
                  name="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Vehicle Capacity (kg)</label>
                <input
                  type="text"
                  name="vehicle_capacity"
                  value={formData.vehicle_capacity}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Service Radius (km)</label>
                <input
                  type="number"
                  name="service_radius"
                  value={formData.service_radius}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  min="1"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Image</label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="h-32 w-32 rounded-md overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                    {vehicleImagePreview ? (
                      <img 
                        src={vehicleImagePreview} 
                        alt="Vehicle" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mt-1 text-sm text-gray-600">
                          Click to upload
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    id="vehicle-image-upload"
                    name="vehicle_image"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="vehicle-image-upload"
                    className="absolute inset-0 cursor-pointer"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  <p>Upload a clear photo of your vehicle</p>
                  <p className="text-xs mt-1">Max size: 5MB</p>
                </div>
              </div>
            </div>

            {/* Documents Upload */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Documents</label>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  {documentPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="h-24 w-24 rounded-md overflow-hidden border border-gray-200">
                        <img 
                          src={preview.preview} 
                          alt={`Document ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <p className="text-xs text-gray-500 mt-1 truncate w-24">
                        {preview.file.name}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div>
                  <label
                    htmlFor="document-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Upload Documents
                  </label>
                  <input
                    id="document-upload"
                    name="verification_documents"
                    type="file"
                    className="sr-only"
                    multiple
                    onChange={handleFileChange}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload vehicle documents, license, etc. (PDF, JPG, PNG up to 10MB)
                  </p>
                </div>
              </div>
            </div>
            
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  if (isEditing) {
    return renderEditForm();
  }

  if (!transporter) return null;

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
            <Button 
              variant="outline" 
              className="w-full sm:w-auto text-sm"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
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
