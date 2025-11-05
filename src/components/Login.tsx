import { useState } from 'react';
import logo from '../assets/logo.png';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

interface LoginFormData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({ username: '', password: '' });
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const loginResponse = await axios.post<{ token: string }>(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/login/`,
        formData
      );
      
      const { token } = loginResponse.data;

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
      console.error('Login error:', error);
      setErrorMessage(t('invalid_credentials'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-soft-gradient">
      {/* Brand Logo */}
      <div className="mb-8 text-center">
        <img src={logo} alt="MulyaBazzar Logo" className="w-24 h-24 mx-auto mb-4 rounded-xl shadow-soft" />
        <h1 className="text-h2 font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
          MulyaBazzar
        </h1>
        <p className="text-body text-neutral-600 mt-2">
          Welcome back! Sign in to your account
        </p>
      </div>

      {/* Login Form */}
      <div className="card-elevated w-full max-w-md">
        <h2 className="text-h3 font-bold text-center mb-6 text-neutral-900">
          {t('login')}
        </h2>

        {errorMessage && (
          <div className="status-error mb-6 p-4 rounded-lg">
            <p className="text-body-sm font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="content-spacing">
          <div>
            <label htmlFor="username" className="block text-body-sm font-semibold text-neutral-700 mb-2">
              {t('username')} *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter your username or email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-body-sm font-semibold text-neutral-700 mb-2">
              {t('password')} *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter your password"
              required
            />
            <p className="text-caption text-neutral-500 mt-1">
              Forgot your password? <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">Reset here</a>
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-4"
          >
            {t('login')}
          </button>

          <div className="text-center">
            <p className="text-body-sm text-neutral-600">
              Don't have an account?{' '}
              <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up now
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
