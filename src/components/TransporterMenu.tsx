import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  TruckIcon,
  MapIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  UserIcon,
  LogoutIcon,
  ChevronDownIcon,
} from '@heroicons/react/outline';

type TransporterStatus = 'active' | 'inactive' | 'suspended' | 'offline';

interface TransporterMenuProps {
  onNavigate?: () => void;
}

interface UserData {
  id?: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  role?: string;
  business_type?: string;
  is_active?: boolean;
}

interface ProfileData {
  id?: number;
  user?: UserData;
}

const TransporterMenu: React.FC<TransporterMenuProps> = ({ onNavigate }) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const menuItems = [
    { name: 'Profile', icon: <UserIcon className="h-5 w-5" />, path: '/profile' },
    { name: 'Available Deliveries', icon: <TruckIcon className="h-5 w-5" />, path: '/deliveries/available' },
    { name: 'My Deliveries', icon: <MapIcon className="h-5 w-5" />, path: '/deliveries/my' },
    { name: 'Delivery History', icon: <ClockIcon className="h-5 w-5" />, path: '/deliveries/history' },
    { name: 'Earnings', icon: <CurrencyDollarIcon className="h-5 w-5" />, path: '/earnings' },
    { name: 'Documents', icon: <DocumentTextIcon className="h-5 w-5" />, path: '/documents' },
    { name: 'Support', icon: <UserGroupIcon className="h-5 w-5" />, path: '/support' },
    { name: 'Logout', icon: <LogoutIcon className="h-5 w-5" />, path: '/logout' },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('No authentication token found');
          return;
        }

        const response = await axios.get<ProfileData>(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/profile/`,
          {
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        setProfileData(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (onNavigate) onNavigate();
    window.location.href = path;
  };

  const handleStatusUpdate = async (newStatus: TransporterStatus) => {
    if (!profileData?.user?.id || isUpdatingStatus) return;

    try {
      setIsUpdatingStatus(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      await axios.patch(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/transporters/${profileData.id}/status/`,
        { status: newStatus, notes: `Status changed to ${newStatus}` },
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (profileData.user) {
        setProfileData({
          ...profileData,
          user: {
            ...profileData.user,
            is_active: newStatus === 'active',
          },
        });
      }
      
      setIsStatusDropdownOpen(false);
      setError(null);
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusDisplay = (isActive: boolean | undefined) => {
    if (isActive === undefined) return 'Unknown';
    return isActive ? 'Active' : 'Inactive';
  };

  const getStatusColor = (isActive: boolean | undefined) => {
    if (isActive === undefined) return 'bg-gray-500';
    return isActive ? 'bg-green-600' : 'bg-red-600';
  };

  return (
    <div className="flex flex-col h-full bg-yellow-800 text-white">
      {profileData && (
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm text-white ${getStatusColor(profileData.user?.is_active)} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-800 focus:ring-orange-500`}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? 'Updating...' : getStatusDisplay(profileData.user?.is_active)}
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </button>
                
                {isStatusDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleStatusUpdate('active')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Active
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('inactive')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Inactive
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('suspended')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Suspended
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('offline')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Offline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {error && (
              <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
          </div>
        </div>
      )}

      <div className="p-4 border-b border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm text-center py-2">
            Error loading profile
          </div>
        ) : profileData ? (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <UserIcon className="h-10 w-10 text-white bg-orange-500 rounded-full p-2" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profileData?.user?.first_name && profileData?.user?.last_name
                  ? `${profileData?.user?.first_name} ${profileData?.user?.last_name}`
                  : profileData?.user?.username || 'Transporter'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {profileData?.user?.email || 'No email provided'}
              </p>
              {profileData?.user?.phone && (
                <p className="text-xs text-gray-400 truncate">
                  {profileData?.user?.phone}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <a
                href={item.path}
                onClick={(e) => handleClick(e, item.path)}
                className="flex items-center p-3 rounded-lg hover:bg-orange-500 transition-colors duration-200 group"
              >
                {React.cloneElement(item.icon, {
                  className: 'h-5 w-5 mr-3 text-white group-hover:text-white transition-colors',
                })}
                <span className="text-sm font-medium">{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default TransporterMenu;
