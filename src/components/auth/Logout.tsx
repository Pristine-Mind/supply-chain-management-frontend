import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../../utils/auth';

const Logout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        // If you have a logout API endpoint, you can call it here
        // await axios.post('/api/auth/logout/');
      } catch (error) {
        console.error('Error during logout:', error);
      } finally {
        // Clear auth data and redirect to login
        removeAuthToken();
        navigate('/login', { replace: true });
      }
    };

    logout();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-700">Logging out...</p>
      </div>
    </div>
  );
};

export default Logout;
