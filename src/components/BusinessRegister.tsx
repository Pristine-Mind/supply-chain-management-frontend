import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  useForm,
  Controller,
  SubmitHandler,
} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
}

const schema = yup.object({
  username: yup.string().required(),
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
  password2: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required(),
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  phone: yup
    .string()
    .matches(/^[0-9]{7,15}$/, 'Invalid phone')
    .required(),
  cityId: yup.number().required().min(1, 'City required'),
  latitude: yup.number().required(),
  longitude: yup.number().required(),
  businessType: yup.string().oneOf(['retailer','distributor']).required(),
}).required();

export const BusinessRegister: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityError, setCityError] = useState<string|null>(null);
  const [submitError, setSubmitError] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [position, setPosition] = useState<LatLngExpression>([27.7172,85.3240]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      cityId: 0,
      latitude: (position as [number,number])[0],
      longitude: (position as [number,number])[1],
      businessType: 'retailer',
    },
  });

  useEffect(() => {
    setLoadingCities(true);
    axios
      .get<City[]>(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/cities/`, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
      })
      .then(res => setCities(res.data))
      .catch(() => setCityError('Failed to load cities'))
      .finally(() => setLoadingCities(false));
  }, []);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat, lng = e.latlng.lng;
        setPosition([lat,lng]);
        setValue('latitude', lat);
        setValue('longitude', lng);
      },
    });
    return <Marker position={position} />;
  }

  const onSubmit: SubmitHandler<FormValues> = async data => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/register/business/`, {
        username: data.username,
        email: data.email,
        password: data.password,
        password2: data.password2,
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phone,
        location: data.cityId,
        latitude: data.latitude,
        longitude: data.longitude,
        business_type: data.businessType,
      }, {
        headers: { Authorization: `Token ${localStorage.getItem('token')}` },
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
        <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-orange-500 to-yellow-400 p-8 text-white">
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">Grow Your Business</h2>
            <p className="mb-6">Join our network of businesses and reach more customers with our platform.</p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Reach More Customers</span>
              </div>
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Manage Inventory</span>
              </div>
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block font-medium">Username</label>
                <input
                  {...register('username')}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-red-500 text-sm">{errors.username?.message}</p>
              </div>

              <div>
                <label className="block font-medium">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-red-500 text-sm">{errors.email?.message}</p>
              </div>

              <div>
                <label className="block font-medium">Password</label>
                <input
                  type="password"
                  {...register('password')}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-red-500 text-sm">{errors.password?.message}</p>
              </div>

              <div>
                <label className="block font-medium">Confirm Password</label>
                <input
                  type="password"
                  {...register('password2')}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-red-500 text-sm">{errors.password2?.message}</p>
              </div>

              <div>
                <label className="block font-medium">First Name</label>
                <input
                  {...register('firstName')}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-red-500 text-sm">{errors.firstName?.message}</p>
              </div>

              <div>
                <label className="block font-medium">Last Name</label>
                <input
                  {...register('lastName')}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-red-500 text-sm">{errors.lastName?.message}</p>
              </div>

              <div>
                <label className="block font-medium">Phone Number</label>
                <input
                  {...register('phone')}
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-red-500 text-sm">{errors.phone?.message}</p>
              </div>

              <div>
                <label className="block font-medium">City</label>
                <Controller
                  control={control}
                  name="cityId"
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={loadingCities}
                      className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                <p className="text-red-500 text-sm">{errors.cityId?.message}</p>
                {cityError && <p className="text-red-500 text-sm">{cityError}</p>}
              </div>

              <div>
                <label className="block font-medium">Business Type</label>
                <Controller
                  control={control}
                  name="businessType"
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="retailer">Retailer</option>
                      <option value="distributor">Distributor</option>
                    </select>
                  )}
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Business Location</label>
                <MapContainer
                  center={position}
                  zoom={13}
                  style={{ height: 200, width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker />
                </MapContainer>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full">
                  <div className="w-full">
                    <input
                      readOnly
                      value={(position as [number,number])[0].toFixed(6)}
                      placeholder="Latitude"
                      className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div className="w-full">
                    <input
                      readOnly
                      value={(position as [number,number])[1].toFixed(6)}
                      placeholder="Longitude"
                      className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {(errors.latitude || errors.longitude) && (
                  <p className="text-red-500 text-sm">Please select location on map</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
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
              <div className="bg-orange-100 p-4 rounded-full inline-block mb-4">
                <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your business information is protected with industry-standard security measures.</p>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <p className="text-gray-700 mb-4">Already have a business account?</p>
              <a href="/login" className="inline-block w-full px-4 py-2 text-orange-500 font-medium border border-orange-500 rounded-md hover:bg-orange-50 transition-colors">
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
