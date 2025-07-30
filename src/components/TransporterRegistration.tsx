import React, { useState } from 'react';
import * as Form from '@radix-ui/react-form';
import * as Tabs from '@radix-ui/react-tabs';
import { AlertCircle, CheckCircle2, Upload, Truck, Shield, Clock, CheckCircle } from 'lucide-react';

interface TransporterRegistrationData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  
  license_number: string;
  vehicle_type: string;
  vehicle_number: string;
  vehicle_capacity: number;
  phone: string;
  current_latitude?: number;
  current_longitude?: number;
  vehicle_image?: File;
  vehicle_documents?: File;
}

interface FormErrors {
  [key: string]: string[];
}

const TransporterRegistration: React.FC = () => {
  const [formData, setFormData] = useState<TransporterRegistrationData>({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    license_number: '',
    vehicle_type: '',
    vehicle_number: '',
    vehicle_capacity: 0,
    phone: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentTab, setCurrentTab] = useState('personal');

  const vehicleTypes = {
    'bike': 'Bike',
    'car': 'Car',
    'van': 'Van',
    'truck': 'Truck',
    'bicycle': 'Bicycle',
    'other': 'Other'
  };

  const handleInputChange = (field: keyof TransporterRegistrationData, value: string | number | File) => {
    // For latitude and longitude, ensure we handle the number properly
    if ((field === 'current_latitude' || field === 'current_longitude') && typeof value === 'number') {
      // Keep the number as is for the form state
      // We'll format it during submission
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: []
      }));
    }
  };

  const handleFileChange = (field: 'vehicle_image' | 'vehicle_documents', file: File | null) => {
    if (file) {
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            current_latitude: position.coords.latitude,
            current_longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) newErrors.username = ['Username is required'];
    if (!formData.email.trim()) newErrors.email = ['Email is required'];
    if (!formData.password) newErrors.password = ['Password is required'];
    if (formData.password !== formData.password2) {
      newErrors.password2 = ['Passwords do not match'];
    }
    if (!formData.first_name.trim()) newErrors.first_name = ['First name is required'];
    if (!formData.last_name.trim()) newErrors.last_name = ['Last name is required'];

    if (!formData.license_number.trim()) newErrors.license_number = ['License number is required'];
    if (!formData.vehicle_type) newErrors.vehicle_type = ['Vehicle type is required'];
    if (!formData.vehicle_number.trim()) newErrors.vehicle_number = ['Vehicle number is required'];
    if (!formData.vehicle_capacity || formData.vehicle_capacity <= 0) {
      newErrors.vehicle_capacity = ['Vehicle capacity must be greater than 0'];
    }
    if (!formData.phone.trim()) newErrors.phone = ['Phone number is required'];

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCoordinate = (value: number | undefined): string | null => {
    if (value === undefined || value === null) return null;
    const str = value.toString();
    const decimalIndex = str.indexOf('.');
    if (decimalIndex === -1) return str;
    
    const integerPart = str.substring(0, decimalIndex);
    let decimalPart = str.substring(decimalIndex + 1);
    
    if (decimalPart.length > 6) {
      decimalPart = decimalPart.substring(0, 6);
    }
    
    return `${integerPart}.${decimalPart}`.replace(/\.?0+$/, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = new FormData();
    
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'current_latitude' && key !== 'current_longitude' && value !== undefined && value !== null) {
        if (value instanceof File) {
          submitData.append(key, value);
        } else {
          submitData.append(key, value.toString());
        }
      }
    });

    const formattedLat = formatCoordinate(formData.current_latitude);
    const formattedLng = formatCoordinate(formData.current_longitude);
    
    if (formattedLat !== null) submitData.append('current_latitude', formattedLat);
    if (formattedLng !== null) submitData.append('current_longitude', formattedLng);

    try {
      setIsLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/register/transporter/`, {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const errorData = await response.json();
        setErrors(errorData);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setErrors({ general: ['Registration failed. Please try again.'] });
    } finally {
      setIsLoading(false);
    }
  };

  const renderError = (field: string) => {
    if (errors[field] && errors[field].length > 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
          <AlertCircle className="w-4 h-4" />
          {errors[field][0]}
        </div>
      );
    }
    return null;
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600">Your transporter account has been created successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:flex flex-col w-1/4 bg-gradient-to-b from-yellow-600 to-yellow-800 text-white p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Become a Transporter</h2>
          <p className="text-blue-100">Join our network of trusted transporters and start earning today!</p>
        </div>
        
        <div className="mt-auto space-y-6">
          <div className="flex items-start space-x-3">
            <Truck className="w-6 h-6 mt-1 text-blue-200 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Flexible Schedule</h3>
              <p className="text-sm text-blue-100">Work when you want, where you want</p>   
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 mt-1 text-blue-200 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Secure Payments</h3>
              <p className="text-sm text-blue-100">Get paid directly to your account</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Clock className="w-6 h-6 mt-1 text-blue-200 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">24/7 Support</h3>
              <p className="text-sm text-blue-100">We're here to help you anytime</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-2/4 p-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Transporter Registration
          </h1>

          <Tabs.Root value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <Tabs.List className="grid w-full grid-cols-3 mb-6">
          <Tabs.Trigger
            value="personal"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-l-md hover:bg-gray-200 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:border-orange-600"
          >
            Personal Info
          </Tabs.Trigger>
          <Tabs.Trigger
            value="vehicle"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border-t border-b border-gray-300 hover:bg-gray-200 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:border-orange-600"
          >
            Vehicle Details
          </Tabs.Trigger>
          <Tabs.Trigger
            value="documents"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-r-md hover:bg-gray-200 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:border-orange-600"
          >
            Documents
          </Tabs.Trigger>
        </Tabs.List>

        <Form.Root onSubmit={handleSubmit}>
          <Tabs.Content value="personal" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Field name="first_name">
                <Form.Label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </Form.Label>
                <Form.Control asChild>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </Form.Control>
                {renderError('first_name')}
              </Form.Field>

              <Form.Field name="last_name">
                <Form.Label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </Form.Label>
                <Form.Control asChild>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </Form.Control>
                {renderError('last_name')}
              </Form.Field>
            </div>

            <Form.Field name="username">
              <Form.Label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </Form.Label>
              <Form.Control asChild>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </Form.Control>
              {renderError('username')}
            </Form.Field>

            <Form.Field name="email">
              <Form.Label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </Form.Label>
              <Form.Control asChild>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </Form.Control>
              {renderError('email')}
            </Form.Field>

            <Form.Field name="phone">
              <Form.Label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </Form.Label>
              <Form.Control asChild>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </Form.Control>
              {renderError('phone')}
            </Form.Field>

            <div className="grid grid-cols-2 gap-4">
              <Form.Field name="password">
                <Form.Label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </Form.Label>
                <Form.Control asChild>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </Form.Control>
                {renderError('password')}
              </Form.Field>

              <Form.Field name="password2">
                <Form.Label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </Form.Label>
                <Form.Control asChild>
                  <input
                    type="password"
                    value={formData.password2}
                    onChange={(e) => handleInputChange('password2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </Form.Control>
                {renderError('password2')}
              </Form.Field>
            </div>
          </Tabs.Content>

          <Tabs.Content value="vehicle" className="space-y-4">
            <Form.Field name="license_number">
              <Form.Label className="block text-sm font-medium text-gray-700 mb-1">
                License Number *
              </Form.Label>
              <Form.Control asChild>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => handleInputChange('license_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </Form.Control>
              {renderError('license_number')}
            </Form.Field>

            <div className="grid grid-cols-2 gap-4">
              <Form.Field name="vehicle_type">
                <Form.Label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type *
                </Form.Label>
                <Form.Control asChild>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => handleInputChange('vehicle_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select vehicle type</option>
                    {Object.entries(vehicleTypes).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </Form.Control>
                {renderError('vehicle_type')}
              </Form.Field>

              <Form.Field name="vehicle_number">
                <Form.Label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number *
                </Form.Label>
                <Form.Control asChild>
                  <input
                    type="text"
                    value={formData.vehicle_number}
                    onChange={(e) => handleInputChange('vehicle_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </Form.Control>
                {renderError('vehicle_number')}
              </Form.Field>
            </div>

            <Form.Field name="vehicle_capacity">
              <Form.Label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Capacity (kg) *
              </Form.Label>
              <Form.Control asChild>
                <input
                  type="number"
                  min="1"
                  value={formData.vehicle_capacity}
                  onChange={(e) => handleInputChange('vehicle_capacity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </Form.Control>
              {renderError('vehicle_capacity')}
            </Form.Field>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Current Location</label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Get Current Location
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.current_latitude || ''}
                    onChange={(e) => handleInputChange('current_latitude', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Auto-detect"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.current_longitude || ''}
                    onChange={(e) => handleInputChange('current_longitude', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Auto-detect"
                  />
                </div>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="documents" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('vehicle_image', e.target.files?.[0] || null)}
                  className="hidden"
                  id="vehicle-image"
                />
                <label
                  htmlFor="vehicle-image"
                  className="cursor-pointer text-blue-600 hover:text-blue-800"
                >
                  Choose vehicle image
                </label>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                {formData.vehicle_image && (
                  <p className="text-sm text-green-600 mt-2">✓ {formData.vehicle_image.name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('vehicle_documents', e.target.files?.[0] || null)}
                  className="hidden"
                  id="vehicle-documents"
                />
                <label
                  htmlFor="vehicle-documents"
                  className="cursor-pointer text-blue-600 hover:text-blue-800"
                >
                  Choose vehicle documents
                </label>
                <p className="text-xs text-gray-500 mt-1">PDF, DOC, or image files up to 10MB</p>
                {formData.vehicle_documents && (
                  <p className="text-sm text-green-600 mt-2">✓ {formData.vehicle_documents.name}</p>
                )}
              </div>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.general[0]}</span>
                </div>
              </div>
            )}
          </Tabs.Content>

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => {
                const tabs = ['personal', 'vehicle', 'documents'];
                const currentIndex = tabs.indexOf(currentTab);
                if (currentIndex > 0) {
                  setCurrentTab(tabs[currentIndex - 1]);
                }
              }}
              disabled={currentTab === 'personal'}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentTab === 'documents' ? (
              <Form.Submit asChild>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Registering...' : 'Register'}
                </button>
              </Form.Submit>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const tabs = ['personal', 'vehicle', 'documents'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex < tabs.length - 1) {
                    setCurrentTab(tabs[currentIndex + 1]);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            )}
          </div>
        </Form.Root>
          </Tabs.Root>
        </div>
      
      </div>
      
      <div className="hidden md:flex flex-col w-1/4 bg-gray-100 p-8 border-l border-gray-200">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Why Join Us?</h2>
          <p className="text-gray-600">Top reasons to become a transporter with us</p>
        </div>
        
        <div className="space-y-4">
          {[
            'Competitive rates for every delivery',
            'Weekly payments with no hidden fees',
            'Easy-to-use mobile app for managing deliveries',
            'Insurance coverage for all shipments',
            'Dedicated account manager'
          ].map((benefit, index) => (
            <div key={index} className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Need Help?</h3>
          <p className="text-sm text-gray-600 mb-3">Our support team is available 24/7 to assist you with the registration process.</p>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Contact Support →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransporterRegistration;
