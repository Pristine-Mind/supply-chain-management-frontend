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
    <div className="min-h-screen bg-soft-gradient">
      <Navbar />
      <div className="flex flex-col lg:flex-row mt-4">
        {/* Left Sidebar - Benefits */}
        <div className="hidden lg:flex lg:w-1/3 bg-brand-gradient p-8 text-white">
          <div className="flex flex-col justify-center content-spacing">
            <h2 className="text-h2 font-bold mb-4">Join Our Community</h2>
            <p className="text-body mb-8 opacity-90">
              Create an account to access exclusive features and start your journey with us.
            </p>
            
            <div className="content-spacing">
              <div className="flex items-center">
                <div className="bg-white/20 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold">Easy Registration</h4>
                  <p className="text-body-sm opacity-80">Quick setup process</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-white/20 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold">Secure & Private</h4>
                  <p className="text-body-sm opacity-80">Your data is protected</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-white/20 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75M15.91 11.669a2.25 2.25 0 01-1.81 3.83l-1.11.956a3.359 3.359 0 01-4.91 0l-1.11-.956a2.25 2.25 0 01-1.81-3.83L12 8.25l3.91 3.419z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold">24/7 Support</h4>
                  <p className="text-body-sm opacity-80">We're here to help</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="w-full lg:w-1/3 p-8 bg-white shadow-medium">
          <div className="max-w-md mx-auto">
            <h2 className="text-h2 font-bold mb-2 text-center text-neutral-900">Create Account</h2>
            <p className="text-body text-neutral-600 text-center mb-8">
              Fill in your details to get started
            </p>

            {submitError && (
              <div className="status-error mb-6 p-4 rounded-lg">
                <p className="text-body-sm font-medium">{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="content-spacing">
              <div>
                <label className="block text-body-sm font-semibold text-neutral-700 mb-2">
                  Username *
                </label>
                <input
                  {...register('username')}
                  className="input-field"
                  placeholder="Choose a username"
                />
                {errors.username && (
                  <p className="text-caption text-accent-error-600 mt-1">{errors.username?.message}</p>
                )}
              </div>

              <div>
                <label className="block text-body-sm font-semibold text-neutral-700 mb-2">
                  Email Address *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="input-field"
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="text-caption text-accent-error-600 mt-1">{errors.email?.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-semibold text-neutral-700 mb-2">
                    First Name *
                  </label>
                  <input
                    {...register('firstName')}
                    className="input-field"
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="text-caption text-accent-error-600 mt-1">{errors.firstName?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-body-sm font-semibold text-neutral-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    {...register('lastName')}
                    className="input-field"
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <p className="text-caption text-accent-error-600 mt-1">{errors.lastName?.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-body-sm font-semibold text-neutral-700 mb-2">
                  Phone Number *
                </label>
                <input
                  {...register('phone')}
                  className="input-field"
                  placeholder="+977 98xxxxxxxx"
                />
                {errors.phone && (
                  <p className="text-caption text-accent-error-600 mt-1">{errors.phone?.message}</p>
                )}
                <p className="text-caption text-neutral-500 mt-1">
                  We'll use this for important account updates
                </p>
              </div>

              <div>
                <label className="block text-body-sm font-semibold text-neutral-700 mb-2">
                  Password *
                </label>
                <input
                  {...register('password')}
                  type="password"
                  className="input-field"
                  placeholder="Create a strong password"
                />
                {errors.password && (
                  <p className="text-caption text-accent-error-600 mt-1">{errors.password?.message}</p>
                )}
                <p className="text-caption text-neutral-500 mt-1">
                  Minimum 6 characters
                </p>
              </div>

              <div>
                <label className="block text-body-sm font-semibold text-neutral-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  {...register('password2')}
                  type="password"
                  className="input-field"
                  placeholder="Confirm your password"
                />
                {errors.password2 && (
                  <p className="text-caption text-accent-error-600 mt-1">{errors.password2?.message}</p>
                )}
              </div>

              <div>
                <label className="block text-body-sm font-semibold text-neutral-700 mb-2">
                  City *
                </label>
                <Controller
                  name="cityId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={loadingCities}
                      className="input-field"
                    >
                      <option value={0}>Select your city</option>
                      {cities.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.cityId && (
                  <p className="text-caption text-accent-error-600 mt-1">{errors.cityId?.message}</p>
                )}
                {errorCities && (
                  <p className="text-caption text-accent-error-600 mt-1">{errorCities}</p>
                )}
              </div>

              <div>
                <label className="block text-body-sm font-semibold text-neutral-700 mb-2">
                  Select Location
                </label>
                <div className="rounded-lg overflow-hidden border border-neutral-300" style={{ height: 200 }}>
                  <LocationPicker
                    initialCenter={{ lat: position[0], lng: position[1] }}
                    zoom={13}
                    onSelect={handleSelect}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    readOnly
                    value={position[0].toFixed(6)}
                    placeholder="Latitude"
                    className="input-field text-center"
                  />
                  <input
                    readOnly
                    value={position[1].toFixed(6)}
                    placeholder="Longitude"
                    className="input-field text-center"
                  />
                </div>
                <p className="text-caption text-neutral-500 mt-1">
                  Click on the map to select your precise location
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="text-center">
                <p className="text-body-sm text-neutral-600">
                  Already have an account?{' '}
                  <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                    Sign in here
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
        
        {/* Right Sidebar - Security */}
        <div className="hidden lg:flex lg:w-1/3 bg-neutral-100 p-8">
          <div className="flex flex-col justify-center text-center content-spacing">
            <div>
              <div className="bg-primary-100 p-6 rounded-full inline-block mb-6">
                <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-h3 font-semibold mb-3">Secure Registration</h3>
              <p className="text-body text-neutral-600 mb-8">
                Your information is protected with industry-standard security measures and encryption.
              </p>
            </div>
            
            <div className="pt-6 border-t border-neutral-200">
              <p className="text-body text-neutral-700 mb-4">
                Need help with registration?
              </p>
              <a href="/contact" className="btn-secondary w-full text-center">
                Contact Support
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
