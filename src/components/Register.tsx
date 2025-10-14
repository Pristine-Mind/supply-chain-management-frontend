import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  useForm,
  SubmitHandler,
  Controller,
} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import LocationPicker from './LocationPicker';
import Footer from './Footer';
import Navbar from './Navbar';



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
  cityId: yup.number().required(),
}).required();

const Register = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [errorCities, setErrorCities] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [position, setPosition] = useState<[number, number]>([27.7172, 85.3240]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      cityId: 0,
    },
  });

  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const { data } = await axios.get<City[]>(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/cities/`, {
          headers: {},
        });
        setCities(data);
      } catch {
        setErrorCities('Could not load cities');
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  const onSubmit: SubmitHandler<FormValues> = async (vals) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = {
        username: vals.username,
        email: vals.email,
        password: vals.password,
        password2: vals.password2,
        first_name: vals.firstName,
        last_name: vals.lastName,
        phone: vals.phone,
        city_id: vals.cityId,
        latitude: position[0],
        longitude: position[1],
      };
      await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/register/user/`, payload, {
        headers: {},
      });
      alert('Registration successful!');
      navigate('/login'); 
    } catch (e: any) {
      setSubmitError(
        e.response?.data?.message || 'Failed to register'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col lg:flex-row mt-4">
        <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-orange-500 to-yellow-400 p-8 text-white">
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
            <p className="mb-6">Create an account to access exclusive features and start your journey with us.</p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Easy Registration</span>
              </div>
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Secure & Private</span>
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
        <div className="w-full lg:w-1/3 p-6 bg-white shadow-lg">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create an Account</h2>

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
                  {...register('email')}
                  type="email"
                  className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-red-500 text-sm">{errors.email?.message}</p>
        </div>

        <div>
          <label className="block font-medium">Password</label>
          <input
            {...register('password')}
            type="password"
            className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <p className="text-red-500 text-sm">{errors.password?.message}</p>
        </div>

        <div>
          <label className="block font-medium">Confirm Password</label>
          <input
            {...register('password2')}
            type="password"
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
                  name="cityId"
                  control={control}
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
                {errorCities && (
                  <p className="text-red-500 text-sm">{errorCities}</p>
                )}
              </div>

              <div>
                <label className="block font-medium mb-2">Select Location</label>
                <div style={{ height: 200, width: '100%' }}>
                  <LocationPicker
                    initialCenter={{ lat: position[0], lng: position[1] }}
                    zoom={13}
                    onSelect={handleSelect}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full">
                  <div className="w-full">
                    <input
                      readOnly
                      value={position[0].toFixed(6)}
                      placeholder="Latitude"
                      className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div className="w-full">
                    <input
                      readOnly
                      value={position[1].toFixed(6)}
                      placeholder="Longitude"
                      className="w-full border px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Register'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="hidden lg:flex lg:w-1/3 bg-gray-100 p-8">
          <div className="flex flex-col justify-center text-center">
            <div className="mb-6">
              <div className="bg-orange-100 p-4 rounded-full inline-block mb-4">
                <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your information is protected with industry-standard security measures.</p>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <p className="text-gray-700 mb-4">Already have an account?</p>
              <a href="/login" className="inline-block w-full px-4 py-2 text-orange-500 font-medium border border-orange-500 rounded-md hover:bg-orange-50 transition-colors">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
