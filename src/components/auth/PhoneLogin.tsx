import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type FormData = {
  phone_number: string;
  otp: string;
};

// Response types for API calls
type APIResponse<T> = {
  data: T;
  status: number;
  statusText: string;
};

type LoginResponse = {
  token: string;
  has_access_to_marketplace: boolean;
  business_type: string;
  shop_id: string;
  redirect_url?: string;
};

type OTPVerifyResponse = {
  is_verified: boolean;
};

const PhoneLogin: React.FC = () => {
  const [showOtpField, setShowOtpField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const loginSchema = yup.object().shape({
    phone_number: yup
      .string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
    otp: yup
      .string()
      .when('showOtpField', {
        is: true,
        then: (schema) => schema.required('OTP is required').length(6, 'OTP must be 6 digits'),
        otherwise: (schema) => schema.notRequired(),
      }),
  });

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    getValues,
    watch
  } = useForm<FormData>({
    resolver: yupResolver(loginSchema) as any, // Type assertion to handle yup resolver type
    defaultValues: {
      phone_number: '',
      otp: '',
    },
  });
  
  // Watch for form changes to trigger validation
  watch(['phone_number', 'otp']);

  const requestOTP = async (phoneNumber: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await axios.post<{ message: string }>(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/otp/request/`,
        { phone_number: phoneNumber }
      );
      
      setMessage(response.data.message);
      setShowOtpField(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
      console.error('OTP request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (data: FormData): Promise<void> => {
    try {
      setIsLoading(true);
      setError('');
      
      // First verify the OTP
      const verifyResponse = await axios.post<OTPVerifyResponse>(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/otp/verify/`,
        {
          phone_number: data.phone_number,
          otp: data.otp
        }
      );
      
      if (!verifyResponse.data.is_verified) {
        throw new Error('OTP verification failed');
      }
      
      // If OTP is verified, proceed with login
      const loginResponse = await axios.post<LoginResponse>(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/phone-login/`,
        { phone_number: data.phone_number }
      );
      
      // Save token and user data
      localStorage.setItem('token', loginResponse.data.token);
      localStorage.setItem('user', JSON.stringify({
        hasAccessToMarketplace: loginResponse.data.has_access_to_marketplace,
        businessType: loginResponse.data.business_type,
        shopId: loginResponse.data.shop_id,
      }));

      // Redirect based on user type or to home
      if (loginResponse.data.redirect_url) {
        window.location.href = loginResponse.data.redirect_url;
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                         err.response?.data?.detail || 
                         'Verification failed. Please try again.';
      setError(errorMessage);
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: FormData) => {
    if (showOtpField) {
      verifyOTP(data);
    } else {
      requestOTP(data.phone_number);
    }
  };

  const handleResendOTP = () => {
    const phoneNumber = getValues('phone_number');
    if (phoneNumber) {
      requestOTP(phoneNumber);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showOtpField ? 'Enter OTP' : 'Login with Phone'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showOtpField
              ? 'We\'ve sent a 6-digit code to your phone'
              : 'Enter your phone number to receive an OTP'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="phone_number" className="sr-only">
                Phone Number
              </label>
              <input
                id="phone_number"
                type="tel"
                disabled={showOtpField || isLoading}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.phone_number ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm`}
                placeholder="Enter phone number"
                {...register('phone_number')}
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
              )}
            </div>

            {showOtpField && (
              <div className="mt-4">
                <label htmlFor="otp" className="sr-only">
                  OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                    errors.otp ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm`}
                  placeholder="Enter 6-digit OTP"
                  {...register('otp')}
                />
                {errors.otp && (
                  <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
                )}
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-sm text-orange-600 hover:text-orange-500 focus:outline-none"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                'Processing...'
              ) : showOtpField ? (
                'Verify OTP'
              ) : (
                'Send OTP'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhoneLogin;
