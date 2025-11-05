import { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Check, Shield } from 'lucide-react';
import LocationPicker from './LocationPicker';


interface City {
  id: number;
  name: string;
}

interface FormValues {
  username: string;
  email: string;
  password: string;
  password2: string;
  firstName: string;
  lastName: string;
  phone: string;
  cityId: number;
  latitude: number;
  longitude: number;
  businessType: 'retailer' | 'distributor';
  registered_business_name: string;
  registration_certificate: FileList | null;
  pan_certificate: FileList | null;
  profile_image: FileList | null;
}

const schema = yup.object({
  username: yup.string().required(),
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
  password2: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required(),
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  phone: yup.string()
    .matches(/^[0-9]{7,15}$/, 'Invalid phone')
    .required(),
  cityId: yup.number().required().min(1, 'City required'),
  latitude: yup.number().required(),
  longitude: yup.number().required(),
  businessType: yup.string().oneOf(['retailer', 'distributor']).required(),
  registered_business_name: yup.string().required('Business name is required'),
  registration_certificate: yup.mixed().required('Registration certificate is required'),
  pan_certificate: yup.mixed().required('PAN certificate is required'),
  profile_image: yup.mixed().required('Profile image is required'),
}).required();

export const BusinessRegister: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Initialize with default position
  const [position, setPosition] = useState<[number, number]>([27.7172, 85.3240]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as any, // Type assertion to fix the resolver type
    defaultValues: {
      cityId: 0,
      latitude: 27.7172,
      longitude: 85.3240,
      businessType: 'retailer',
      registered_business_name: '',
      registration_certificate: null,
      pan_certificate: null,
      profile_image: null,
    },
  });

  useEffect(() => {
    setLoadingCities(true);
    axios
      .get<City[]>(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/cities/`, {
        headers: {},
      })
      .then(res => setCities(res.data))
      .catch(() => setCityError('Failed to load cities'))
      .finally(() => setLoadingCities(false));
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    const newPosition: [number, number] = [lat, lng];
    setPosition(newPosition);
    setValue('latitude', lat);
    setValue('longitude', lng);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data: FormValues) => {
    setSubmitError(null);
    setSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append('username', data.username);
    formDataToSend.append('email', data.email);
    formDataToSend.append('password', data.password);
    formDataToSend.append('password2', data.password2);
    formDataToSend.append('first_name', data.firstName);
    formDataToSend.append('last_name', data.lastName);
    formDataToSend.append('phone_number', data.phone);
    formDataToSend.append('location', String(data.cityId));
    formDataToSend.append('latitude', String(data.latitude));
    formDataToSend.append('longitude', String(data.longitude));
    formDataToSend.append('business_type', data.businessType);
    formDataToSend.append('registered_business_name', data.registered_business_name);

    if (data.registration_certificate && data.registration_certificate.length > 0) {
      formDataToSend.append('registration_certificate', data.registration_certificate[0]);
    }
    if (data.pan_certificate && data.pan_certificate.length > 0) {
      formDataToSend.append('pan_certificate', data.pan_certificate[0]);
    }
    if (data.profile_image && data.profile_image.length > 0) {
      formDataToSend.append('profile_image', data.profile_image[0]);
    }

    try {
      await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/register/business/`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Business registered! Please login.');
    } catch (e: any) {
      setSubmitError(e.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row">
        {/* Left Banner */}
        <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-primary-500 to-primary-400 p-8 text-white">
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">Grow Your Business</h2>
            <p className="mb-6">Join our network of businesses and reach more customers with our platform.</p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <Check className="w-5 h-5" />
                </div>
                <span>Reach More Customers</span>
              </div>
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <Check className="w-5 h-5" />
                </div>
                <span>Manage Inventory</span>
              </div>
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <Check className="w-5 h-5" />
                </div>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="w-full lg:w-1/3 p-6 bg-white shadow-lg">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Business Registration</h2>
            {submitError && (
              <div className="mb-4 text-red-600">{submitError}</div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" encType="multipart/form-data">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Username</label>
                <input
                  {...register('username')}
                  className="input-field focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-red-500 text-sm mt-1">{errors.username?.message}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="input-field focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-red-500 text-sm mt-1">{errors.email?.message}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  {...register('password')}
                  className="input-field focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-red-500 text-sm mt-1">{errors.password?.message}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  {...register('password2')}
                  className="input-field focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-red-500 text-sm mt-1">{errors.password2?.message}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">First Name</label>
                <input
                  {...register('firstName')}
                  className="input-field focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-red-500 text-sm mt-1">{errors.firstName?.message}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  {...register('lastName')}
                  className="input-field focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-red-500 text-sm mt-1">{errors.lastName?.message}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  {...register('phone')}
                  className="input-field focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-red-500 text-sm mt-1">{errors.phone?.message}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">City</label>
                <Controller
                  control={control}
                  name="cityId"
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={loadingCities}
                      className="input-field focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value={0}>Select city</option>
                      {cities.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <p className="text-red-500 text-sm mt-1">{errors.cityId?.message}</p>
                {cityError && <p className="text-red-500 text-sm mt-1">{cityError}</p>}
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Registered Business Name</label>
                <input
                  {...register('registered_business_name')}
                  className="input-field focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your registered business name"
                />
                <p className="text-red-500 text-sm mt-1">{errors.registered_business_name?.message}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Business Type</label>
                <Controller
                  control={control}
                  name="businessType"
                  render={({ field }) => (
                    <select
                      {...field}
                      className="input-field focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="retailer">Retailer</option>
                      <option value="distributor">Distributor</option>
                    </select>
                  )}
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Registration Certificate</label>
                <input
                  type="file"
                  {...register('registration_certificate')}
                  className="input-field focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-red-500 text-sm mt-1">{errors.registration_certificate?.message}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">PAN Certificate</label>
                <input
                  type="file"
                  {...register('pan_certificate')}
                  className="input-field focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-red-500 text-sm mt-1">{errors.pan_certificate?.message}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Profile Image</label>
                <input
                  type="file"
                  {...register('profile_image')}
                  className="input-field focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-red-500 text-sm mt-1">{errors.profile_image?.message}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Business Location</label>
                <div style={{ height: '400px', width: '100%' }}>
                  <LocationPicker
                    initialCenter={{ lat: position[0], lng: position[1] }}
                    zoom={13}
                    onSelect={handleLocationSelect}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full">
                  <div className="w-full">
                    <input
                      readOnly
                      value={position ? position[0].toFixed(4) : 'N/A'}
                      placeholder="Latitude"
                      className="input-field focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="w-full">
                    <input
                      readOnly
                      value={position ? position[1].toFixed(4) : 'N/A'}
                      placeholder="Longitude"
                      className="input-field focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                {(errors.latitude || errors.longitude) && (
                  <p className="text-red-500 text-sm mt-1">Please select location on map</p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Registering...' : 'Register Business'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Banner */}
        <div className="hidden lg:flex lg:w-1/3 bg-gray-100 p-8">
          <div className="flex flex-col justify-center text-center">
            <div className="mb-6">
              <div className="bg-primary-100 p-4 rounded-full inline-block mb-4">
                <Shield className="w-10 h-10 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your business information is protected with industry-standard security measures.</p>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <p className="text-gray-700 mb-4">Already have a business account?</p>
              <a href="/login" className="inline-block w-full px-4 py-2 text-primary-500 font-medium border border-primary-500 rounded-md hover:bg-primary-50 transition-colors">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessRegister;
