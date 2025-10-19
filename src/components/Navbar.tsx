import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const ChevronDownIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const MenuIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UserIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LogoutIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, onClick, className = "" }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`
        relative px-3 py-2 text-sm font-medium transition-all duration-200
        ${isActive 
          ? 'text-orange-600' 
          : 'text-gray-700 hover:text-orange-600'
        }
        ${className}
        group
      `}
    >
      {children}
      {isActive && (
        <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-orange-600 rounded-full" />
      )}
      <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-orange-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
    </Link>
  );
};

const UserAvatar: React.FC<{ user: any; size?: 'sm' | 'md' }> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm'
  };

  const initial = user?.name 
    ? user.name.charAt(0).toUpperCase() 
    : user?.email 
    ? user.email.charAt(0).toUpperCase() 
    : 'U';

  return (
    <div className={`
      ${sizeClasses[size]} 
      rounded-full bg-gradient-to-br from-orange-400 to-orange-600 
      flex items-center justify-center text-white font-semibold
      shadow-sm ring-2 ring-white/20
    `}>
      {initial}
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/marketplace', label: 'Marketplace' },
    { path: '/blog', label: 'Blog' },
    { path: '/contact', label: 'Contact' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const closeMenus = () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      
      if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <img 
                  src={logo} 
                  alt="MulyaBazzar Logo" 
                  className="w-10 h-10 transition-transform group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-orange-500/20 rounded-full scale-0 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                MulyaBazzar
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path}>
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="true"
                  >
                    <UserAvatar user={user} />
                    <span className="text-sm font-medium">
                      {user?.name || 'My Account'}
                    </span>
                    <ChevronDownIcon 
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in slide-in-from-top-2 duration-200">
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {user?.name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <Link
                            to="/user-profile"
                            onClick={closeMenus}
                            className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <UserIcon className="w-4 h-4 mr-3" />
                            Profile
                          </Link>
                          <Link
                            to="/my-orders"
                            onClick={closeMenus}
                            className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            My Orders
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <LogoutIcon className="w-4 h-4 mr-3" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg hover:from-orange-700 hover:to-orange-800 shadow-sm hover:shadow transition-all duration-200"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <CloseIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
          <div 
            ref={mobileMenuRef}
            className="fixed top-16 left-0 right-0 bg-white shadow-lg animate-in slide-in-from-top-4 duration-200"
          >
            <div className="px-4 py-6 space-y-4">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMenus}
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-200">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <UserAvatar user={user} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Link
                        to="/user-profile"
                        onClick={closeMenus}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <UserIcon className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        to="/my-orders"
                        onClick={closeMenus}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogoutIcon className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/login"
                      onClick={closeMenus}
                      className="block w-full px-4 py-2 text-center text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={closeMenus}
                      className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
