import { useState } from 'react';
import logo from '../assets/logo.png';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { requestOtp, verifyOtp } from '../api/authApi';
import { Phone, Mail, Lock, ArrowRight } from 'lucide-react';

interface LoginFormData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [formData, setFormData] = useState<LoginFormData>({ username: '', password: '' });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const loginResponse = await axios.post<{ token: string }>(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/login/`,
        formData
      );
      
      const { token } = loginResponse.data;
      await handleLoginSuccess(token);
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(t('invalid_credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await requestOtp(phoneNumber);
      setOtpStep('verify');
    } catch (error: any) {
      console.error('OTP Request error:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await verifyOtp(phoneNumber, otp);
      await handleLoginSuccess(response.token);
    } catch (error: any) {
      console.error('OTP Verify error:', error);
      setErrorMessage(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async (token: string) => {
    try {
      const userInfoResponse = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/user-info/`,
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );
      
      const userData = {
        email: userInfoResponse.data.email || '',
        name: userInfoResponse.data.username || '',
        hasAccessToMarketplace: !!userInfoResponse.data.has_access_to_marketplace,
        businessType: userInfoResponse.data.business_type,
        role: userInfoResponse.data.role,
        shopId: userInfoResponse.data.shop_id,
        b2b_verified: userInfoResponse.data.b2b_verified || false,
      };

      login(token, userData);

      if (userInfoResponse.data && userInfoResponse.data.username) {
        localStorage.setItem('username', userInfoResponse.data.username);
        if (userInfoResponse.data.email) {
          localStorage.setItem('email', userInfoResponse.data.email);
        }
        if (userInfoResponse.data.business_type) {
          localStorage.setItem('business_type', userInfoResponse.data.business_type);
        }
        if (userInfoResponse.data.role) {
          localStorage.setItem('role', userInfoResponse.data.role);
        }
      }

      const roleLower = (userInfoResponse.data.role || '').toLowerCase();
      if (roleLower === 'transporter') {
        navigate('/home');
      } else if (
        userInfoResponse.data.has_access_to_marketplace === false &&
        userInfoResponse.data.business_type === null
      ) {
        navigate('/');
      } else {
        navigate('/home');
      }
    } catch (error) {
      console.error('User info fetch error:', error);
      setErrorMessage('Failed to retrieve user information');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50">
      <div className="mb-8 text-center">
        <img src={logo} alt="MulyaBazzar Logo" className="w-24 h-24 mx-auto mb-4 rounded-xl shadow-sm" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
          MulyaBazzar
        </h1>
        <p className="text-sm text-neutral-600 mt-2">
          Welcome back! Sign in to your account
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 w-full max-w-md">
        
        <div className="flex mb-6 bg-neutral-100 p-1 rounded-lg">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              loginMethod === 'password' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            onClick={() => setLoginMethod('password')}
          >
            Username
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              loginMethod === 'otp' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            onClick={() => setLoginMethod('otp')}
          >
            Mobile Number
          </button>
        </div>

        <h2 className="text-xl font-bold text-center mb-6 text-gray-900">
          {loginMethod === 'password' ? t('login') : 'Mobile Login'}
        </h2>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

        {loginMethod === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-neutral-700 mb-2">
                {t('username')} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Enter your username or email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                {t('password')} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1 text-right">
                <button
                  type="button"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                  onClick={() => navigate('/support')}
                >
                  Forgot password?
                </button>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? 'Logging in...' : t('login')}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={otpStep === 'request' ? handleOtpRequest : handleOtpVerify} className="space-y-6">
            {otpStep === 'request' ? (
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Mobile Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Enter your mobile number"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Enter OTP *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Enter 6-digit OTP"
                    required
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  OTP sent to {phoneNumber}. {' '}
                  <button 
                    type="button" 
                    onClick={() => setOtpStep('request')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Change number
                  </button>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? 'Processing...' : (otpStep === 'request' ? 'Send OTP' : 'Verify & Login')}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-neutral-600">
            Don't have an account?{' '}
            <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up now
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
