import React from 'react';
import { Home, Grid, User, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavigationProps {
  onCategoryClick?: () => void;
}

const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({ onCategoryClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleCategoryClick = () => {
    if (onCategoryClick) {
      onCategoryClick();
    } else {
      const categoriesSection = document.getElementById('categories-section');
      if (categoriesSection) {
        categoriesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center py-2 px-2 space-y-1 transition-colors flex-1 ${
            isActive('/') || location.pathname === '/marketplace'
              ? 'text-primary-600'
              : 'text-neutral-600 hover:text-primary-500'
          }`}
          aria-label="Home"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button
          onClick={handleCategoryClick}
          className="flex flex-col items-center justify-center py-2 px-2 space-y-1 transition-colors text-neutral-600 hover:text-primary-500 flex-1"
          aria-label="Categories"
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-medium">Categories</span>
        </button>

        <button
          onClick={() => navigate('/just-for-you')}
          className={`flex flex-col items-center justify-center py-2 px-2 space-y-1 transition-colors flex-1 ${
            isActive('/just-for-you')
              ? 'text-primary-600'
              : 'text-neutral-600 hover:text-primary-500'
          }`}
          aria-label="Just For You"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-medium">For You</span>
        </button>

        <button
          onClick={() => isAuthenticated ? navigate('/user-profile') : navigate('/login')}
          className={`flex flex-col items-center justify-center py-2 px-2 space-y-1 transition-colors flex-1 ${
            isActive('/user-profile') || isActive('/login')
              ? 'text-primary-600'
              : 'text-neutral-600 hover:text-primary-500'
          }`}
          aria-label="My Account"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Account</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNavigation;
