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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <img src={logo} alt="Logo" className="w-64 h-64 mb-4" />
      <div className="bg-gray-100 shadow-md rounded-lg px-8 py-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">
          {t('login')}
        </h2>

        {errorMessage && (
          <p className="text-red-500 text-center mb-4">{errorMessage}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700">
              {t('username')}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700">
              {t('password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg transition"
          >
            {t('login')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
