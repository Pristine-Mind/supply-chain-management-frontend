import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { styled } from '@stitches/react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const MenuList = styled(NavigationMenu.List, {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
});

const UserMenu = styled('div', {
  position: 'relative',
  display: 'inline-block',
});

const DropdownMenu = styled('div', {
  position: 'absolute',
  right: 0,
  top: '100%',
  marginTop: '0.5rem',
  width: '200px',
  backgroundColor: 'white',
  borderRadius: '0.5rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  zIndex: 50,
  overflow: 'hidden',
});

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.user-menu')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <NavigationMenu.Root>
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <NavigationMenu.List className="flex items-center justify-between h-16">
            <NavigationMenu.Item>
              <Link to="/" className="flex items-center">
                <img src={logo} alt="Logo" className="w-12 h-12" />
                <span className="ml-2 text-xl font-bold text-orange-600">SupplyChain</span>
              </Link>
            </NavigationMenu.Item>

            <MenuList>
              <NavigationMenu.Item>
                <NavigationMenu.Link asChild>
                  <Link to="/" className="px-3 py-2 text-gray-700 hover:text-orange-600">
                    Home
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link asChild>
                  <Link to="/marketplace" className="px-3 py-2 text-gray-700 hover:text-orange-600">
                    Marketplace
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link asChild>
                  <Link to="/blog" className="px-3 py-2 text-gray-700 hover:text-orange-600">
                    Blog
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link asChild>
                  <Link to="/contact" className="px-3 py-2 text-gray-700 hover:text-orange-600">
                    Contact
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>

              {isAuthenticated ? (
                <NavigationMenu.Item className="relative">
                  <UserMenu className="user-menu">
                    <button
                      onClick={() => setIsOpen(!isOpen)}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-orange-600 focus:outline-none"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium">
                        {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="hidden md:inline">My Account</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isOpen && (
                      <DropdownMenu>
                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsOpen(false)}
                          >
                            Profile
                          </Link>
                          <Link
                            to="/orders"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsOpen(false)}
                          >
                            My Orders
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Sign out
                          </button>
                        </div>
                      </DropdownMenu>
                    )}
                  </UserMenu>
                </NavigationMenu.Item>
              ) : (
                <NavigationMenu.Item>
                  <NavigationMenu.Link asChild>
                    <div className="flex space-x-2 ml-2">
                      <Link
                        to="/login"
                        className="px-4 py-2 text-sm font-medium text-orange-600 border border-orange-600 rounded-md hover:bg-orange-50"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/register"
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
                      >
                        Sign up
                      </Link>
                    </div>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              )}
            </MenuList>
          </NavigationMenu.List>
        </div>
      </div>
    </NavigationMenu.Root>
  );
};

export default Navbar;
