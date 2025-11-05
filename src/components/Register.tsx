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
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  MapPin,
  CheckCircle,
  Shield,
  Clock,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import LocationPicker from './LocationPicker';
import Footer from './Footer';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import logo from '../assets/logo.png';



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
      {/* Brand Logo */}
      <div className="pt-8 pb-6 text-center">
        <img src={logo} alt="MulyaBazzar Logo" className="w-20 h-20 mx-auto mb-4 rounded-xl shadow-soft" />
        <h1 className="text-h2 font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
          MulyaBazzar
        </h1>
        <p className="text-body text-neutral-600 mt-2">
          Join our community and start your journey
        </p>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Sidebar - Benefits */}
          <div className="hidden lg:flex lg:col-span-1">
            <Card className="w-full bg-brand-gradient text-white border-0">
              <CardHeader>
                <CardTitle className="text-white text-xl">Join Our Community</CardTitle>
                <p className="text-white/90">
                  Create an account to access exclusive features and start your journey with us.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-full mr-4 flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Easy Registration</h4>
                    <p className="text-body-sm opacity-80">Quick setup process</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-full mr-4 flex-shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Secure & Private</h4>
                    <p className="text-body-sm opacity-80">Your data is protected</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-full mr-4 flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">24/7 Support</h4>
                    <p className="text-body-sm opacity-80">We're here to help</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-1">
            <Card className="shadow-elevation-lg">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-neutral-900">
                  <UserPlus className="w-5 h-5 text-primary-600" />
                  Create Account
                </CardTitle>
                <p className="text-body text-neutral-600">
                  Fill in your details to get started
                </p>
              </CardHeader>
              <CardContent>
                {submitError && (
                  <div className="status-error mb-6 p-4 rounded-lg">
                    <p className="text-body-sm font-medium">{submitError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Username */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-body-sm font-semibold text-neutral-700">
                      Username *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                      <input
                        {...register('username')}
                        id="username"
                        className="input-field pl-10"
                        placeholder="Choose a username"
                      />
                    </div>
                    {errors.username && (
                      <p className="text-caption text-accent-error-600">{errors.username?.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-body-sm font-semibold text-neutral-700">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                      <input
                        {...register('email')}
                        id="email"
                        type="email"
                        className="input-field pl-10"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-caption text-accent-error-600">{errors.email?.message}</p>
                    )}
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="block text-body-sm font-semibold text-neutral-700">
                        First Name *
                      </label>
                      <input
                        {...register('firstName')}
                        id="firstName"
                        className="input-field"
                        placeholder="First name"
                      />
                      {errors.firstName && (
                        <p className="text-caption text-accent-error-600">{errors.firstName?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="lastName" className="block text-body-sm font-semibold text-neutral-700">
                        Last Name *
                      </label>
                      <input
                        {...register('lastName')}
                        id="lastName"
                        className="input-field"
                        placeholder="Last name"
                      />
                      {errors.lastName && (
                        <p className="text-caption text-accent-error-600">{errors.lastName?.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-body-sm font-semibold text-neutral-700">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                      <input
                        {...register('phone')}
                        id="phone"
                        className="input-field pl-10"
                        placeholder="+977 98xxxxxxxx"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-caption text-accent-error-600">{errors.phone?.message}</p>
                    )}
                    <p className="text-caption text-neutral-500">
                      We'll use this for important account updates
                    </p>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-body-sm font-semibold text-neutral-700">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                      <input
                        {...register('password')}
                        id="password"
                        type="password"
                        className="input-field pl-10"
                        placeholder="Create a strong password"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-caption text-accent-error-600">{errors.password?.message}</p>
                    )}
                    <p className="text-caption text-neutral-500">
                      Minimum 6 characters
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label htmlFor="password2" className="block text-body-sm font-semibold text-neutral-700">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                      <input
                        {...register('password2')}
                        id="password2"
                        type="password"
                        className="input-field pl-10"
                        placeholder="Confirm your password"
                      />
                    </div>
                    {errors.password2 && (
                      <p className="text-caption text-accent-error-600">{errors.password2?.message}</p>
                    )}
                  </div>

                  {/* City Selection */}
                  <div className="space-y-2">
                    <label htmlFor="cityId" className="block text-body-sm font-semibold text-neutral-700">
                      City *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                      <Controller
                        name="cityId"
                        control={control}
                        render={({ field }) => (
                          <select
                            {...field}
                            id="cityId"
                            disabled={loadingCities}
                            className="input-field pl-10"
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
                    </div>
                    {errors.cityId && (
                      <p className="text-caption text-accent-error-600">{errors.cityId?.message}</p>
                    )}
                    {errorCities && (
                      <p className="text-caption text-accent-error-600">{errorCities}</p>
                    )}
                  </div>

                  {/* Location Selection */}
                  <div className="space-y-2">
                    <label className="block text-body-sm font-semibold text-neutral-700">
                      Select Location
                    </label>
                    <div className="rounded-lg overflow-hidden border border-neutral-300" style={{ height: 200 }}>
                      <LocationPicker
                        initialCenter={{ lat: position[0], lng: position[1] }}
                        zoom={13}
                        onSelect={handleSelect}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        readOnly
                        value={position[0].toFixed(6)}
                        placeholder="Latitude"
                        className="input-field text-center text-neutral-600"
                      />
                      <input
                        readOnly
                        value={position[1].toFixed(6)}
                        placeholder="Longitude"
                        className="input-field text-center text-neutral-600"
                      />
                    </div>
                    <p className="text-caption text-neutral-500">
                      Click on the map to select your precise location
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4"
                      size="lg"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create Account
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Login Link */}
                  <div className="text-center pt-4 border-t border-neutral-200">
                    <p className="text-body-sm text-neutral-600">
                      Already have an account?{' '}
                      <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                        Sign in here
                      </a>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Sidebar - Security */}
          <div className="hidden lg:flex lg:col-span-1">
            <Card className="w-full bg-neutral-100 border-neutral-200">
              <CardContent className="flex flex-col justify-center text-center py-12">
                <div className="space-y-6">
                  <div>
                    <div className="bg-primary-100 p-6 rounded-full inline-block mb-6">
                      <Shield className="w-12 h-12 text-primary-600" />
                    </div>
                    <h3 className="text-h3 font-semibold mb-3 text-neutral-900">Secure Registration</h3>
                    <p className="text-body text-neutral-600 mb-8">
                      Your information is protected with industry-standard security measures and encryption.
                    </p>
                  </div>
                  
                  <div className="pt-6 border-t border-neutral-200">
                    <p className="text-body text-neutral-700 mb-4">
                      Need help with registration?
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <a href="/contact">
                        Contact Support
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
