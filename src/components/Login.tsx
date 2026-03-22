import { useState } from 'react';
import logo from '../assets/logo.png';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { requestOtp, verifyOtp } from '../api/authApi';
import { Phone, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { AuthErrorDisplay } from './auth/AuthErrorDisplay';
import { categorizeLoginError, sanitizeInput } from '../utils/authValidation';
import type { AuthError } from '../utils/authValidation';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function getLockoutState(): { attempts: number; lockedUntil: number } {
  try {
    const raw = localStorage.getItem('loginLockout');
    return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: 0 };
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

function saveLockoutState(state: { attempts: number; lockedUntil: number }) {
  localStorage.setItem('loginLockout', JSON.stringify(state));
}

function clearLockoutState() {
  localStorage.removeItem('loginLockout');
}

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
  
  const [error, setError] = useState<AuthError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lockout, setLockout] = useState(() => getLockoutState());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: sanitizeInput(value),
    });
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: '',
      });
    }
  };

  const validatePasswordForm = (): boolean => {
    const newFieldErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newFieldErrors.username = 'Username or email is required';
    }

    if (!formData.password) {
      newFieldErrors.password = 'Password is required';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return false;
    }

    return true;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validatePasswordForm()) {
      return;
    }

    // TC-008: check account lockout before attempting login
    const now = Date.now();
    const currentLockout = getLockoutState();
    if (currentLockout.lockedUntil > now) {
      const remainingMins = Math.ceil((currentLockout.lockedUntil - now) / 60000);
      setError({ type: 'auth', message: `Account locked. Too many failed attempts. Try again in ${remainingMins} minute(s).` });
      return;
    }

    setIsLoading(true);

    try {
      const loginResponse = await axios.post<{ token: string }>(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/login/`,
        formData,
        { timeout: 10000 }
      );
      
      const { token } = loginResponse.data;
      // Successful login — clear lockout
      clearLockoutState();
      setLockout({ attempts: 0, lockedUntil: 0 });
      await handleLoginSuccess(token);
    } catch (err) {
      // TC-008: track failed attempts
      const stored = getLockoutState();
      const newAttempts = stored.attempts + 1;
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
        const newState = { attempts: newAttempts, lockedUntil };
        saveLockoutState(newState);
        setLockout(newState);
        setError({ type: 'auth', message: `Account locked for 30 minutes after ${MAX_LOGIN_ATTEMPTS} failed attempts.` });
      } else {
        const newState = { attempts: newAttempts, lockedUntil: 0 };
        saveLockoutState(newState);
        setLockout(newState);
        const categorizedError = categorizeLoginError(err);
        const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
        setError({ ...categorizedError, message: `${categorizedError.message} (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout)` });
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const validatePhoneNumber = (): boolean => {
    const newFieldErrors: Record<string, string> = {};

    if (!phoneNumber.trim()) {
      newFieldErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{7,15}$/.test(phoneNumber.replace(/[\s\-]/g, ''))) {
      newFieldErrors.phone = 'Phone number must be between 7 and 15 digits';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return false;
    }

    return true;
  };

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validatePhoneNumber()) {
      return;
    }

    setIsLoading(true);

    try {
      await requestOtp(phoneNumber);
      setOtpStep('verify');
    } catch (err: any) {
      const categorizedError = categorizeLoginError(err);
      setError(categorizedError);
      console.error('OTP Request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateOtp = (): boolean => {
    if (!otp.trim()) {
      setFieldErrors({ otp: 'OTP is required' });
      return false;
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      setFieldErrors({ otp: 'OTP must be a 6-digit number' });
      return false;
    }

    return true;
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateOtp()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyOtp(phoneNumber, otp);
      await handleLoginSuccess(response.token);
    } catch (err: any) {
      const categorizedError = categorizeLoginError(err);
      setError(categorizedError);
      console.error('OTP Verify error:', err);
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
          },
          timeout: 10000
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
    } catch (err) {
      const categorizedError = categorizeLoginError(err);
      setError(categorizedError);
      console.error('User info fetch error:', err);
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
            onClick={() => {
              setLoginMethod('password');
              setError(null);
              setFieldErrors({});
            }}
          >
            Username
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              loginMethod === 'otp' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            onClick={() => {
              setLoginMethod('otp');
              setError(null);
              setFieldErrors({});
            }}
          >
            Mobile Number
          </button>
        </div>

        <h2 className="text-xl font-bold text-center mb-6 text-gray-900">
          {loginMethod === 'password' ? t('login') : 'Mobile Login'}
        </h2>

        {error && (
          <AuthErrorDisplay 
            error={error.message} 
            type={error.type === 'auth' || error.type === 'validation' ? 'error' : error.type === 'network' ? 'warning' : 'error'}
            onDismiss={() => setError(null)}
          />
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-primary-500 transition-all ${
                    fieldErrors.username ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'
                  }`}
                  placeholder="Enter your username or email"
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.username}
                </p>
              )}
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-primary-500 transition-all ${
                    fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'
                  }`}
                  placeholder="Enter your password"
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.password}
                </p>
              )}
              <p className="text-xs text-neutral-500 mt-2 text-right">
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
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
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
                    onChange={(e) => {
                      setPhoneNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 15));
                      if (fieldErrors.phone) {
                        setFieldErrors({ ...fieldErrors, phone: '' });
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-primary-500 transition-all ${
                      fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'
                    }`}
                    placeholder="Enter your mobile number"
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.phone}
                  </p>
                )}
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
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/[^\d]/g, '').slice(0, 6));
                      if (fieldErrors.otp) {
                        setFieldErrors({ ...fieldErrors, otp: '' });
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-primary-500 transition-all ${
                      fieldErrors.otp ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'
                    }`}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                  />
                </div>
                {fieldErrors.otp && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.otp}
                  </p>
                )}
                <p className="text-xs text-neutral-500 mt-2">
                  OTP sent to {phoneNumber}. {' '}
                  <button 
                    type="button" 
                    onClick={() => {
                      setOtpStep('request');
                      setOtp('');
                      setError(null);
                      setFieldErrors({});
                    }}
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
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
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
