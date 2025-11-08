import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  BarChart3, 
  Users, 
  ShoppingCart,
  Settings,
  Bell,
  User
} from 'lucide-react';

import { fetchLedgerEntries, LedgerEntry } from '../api/ledgerApi';
import { getTransporterStats, type TransporterStats } from '../api/transporterApi';
import TransporterMenu from './TransporterMenu';
import LedgerEntriesTable from './LedgerEntriesTable';
import SidebarNav from './dashboard/SidebarNav';
import TransporterOverview from './dashboard/TransporterOverview';
import { InfoCard, InfoRow } from './dashboard/InfoBlocks';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Notification interface to match API response
interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

// User Profile interface to match API response
interface UserProfile {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  phone: string;
  phone_number: string;
  profile_picture: string | null;
  bio: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  business_type: string;
  registered_business_name: string | null;
  notification_preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
    order_updates: boolean;
  };
}

interface SalesTrend {
  month: string;
  value: number;
}

interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  totalCustomers: number;
  salesTrends: SalesTrend[];
  pendingOrders: number;
  totalRevenue: number;
}

const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [darkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const [data, setData] = useState<DashboardData>({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    totalCustomers: 0,
    salesTrends: [],
    pendingOrders: 0,
    totalRevenue: 0,
  });

  const rawBusinessType = (user?.businessType ?? localStorage.getItem('business_type')) as string | null;
  const rawRole = (user?.role ?? localStorage.getItem('role')) as string | null;
  const businessType = rawBusinessType ? rawBusinessType.trim().toLowerCase() : null;
  const role = rawRole ? rawRole.trim().toLowerCase() : null;

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerCount, setLedgerCount] = useState(0);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(10);

  const [tStats, setTStats] = useState<TransporterStats | null>(null);
  const [tStatsLoading, setTStatsLoading] = useState(false);
  const [tStatsError, setTStatsError] = useState<string | null>(null);

  // Notification and settings state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await axios.get<DashboardData>(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/dashboard/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        }
      );
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationError(null);
      const response = await axios.get<Notification[]>(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/notifications/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        }
      );
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotificationError('Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/user-profile/`,
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        }
      );
      setUserProfile(response.data.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfileError('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/notifications/${notificationId}/`,
        { is_read: true },
        {
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        }
      );
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(notification =>
          axios.patch(
            `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/notifications/${notification.id}/`,
            { is_read: true },
            {
              headers: { Authorization: `Token ${localStorage.getItem('token')}` },
            }
          )
        )
      );
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate('/login');
    } else {
      if (
        user &&
        user.hasAccessToMarketplace === false &&
        user.businessType === null &&
        userProfile?.business_type === null &&
        role !== 'transporter'
      ) {
        navigate('/');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!role && !businessType) {
        navigate('/');
        return;
      }
      
      if (token) {
        if (role !== 'transporter') {
          fetchData();
          fetchNotifications(); // Fetch notifications for business users
          const fetchLedger = async () => {
            setLedgerLoading(true);
            try {
              const offset = (ledgerPage - 1) * ledgerPageSize;
              const res = await fetchLedgerEntries(token, ledgerPageSize, offset);
              setLedgerEntries(res.results);
              setLedgerCount(res.count);
            } catch (e: any) {
              setLedgerError(e.message);
            } finally {
              setLedgerLoading(false);
            }
          };
          fetchLedger();
        } else {
          // Transporter: fetch stats
          const fetchTStats = async () => {
            setTStatsLoading(true);
            try {
              const stats = await getTransporterStats();
              setTStats(stats);
              setTStatsError(null);
            } catch (e: any) {
              setTStatsError(e.message || 'Failed to load transporter stats');
            } finally {
              setTStatsLoading(false);
            }
          };
          fetchTStats();
        }
      }
    }
  }, [isAuthenticated, user, navigate, ledgerPage, ledgerPageSize, role, businessType, loading]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Use profile business type if available, fallback to user business type
  const currentBusinessType = userProfile?.business_type || user?.businessType || businessType;

  // Helper function to extract notification type from message
  const getNotificationType = (message: string) => {
    if (message.includes('🛒') || message.includes('order')) return 'order';
    if (message.includes('⚠️') || message.includes('stock') || message.includes('low')) return 'warning';
    if (message.includes('✅') || message.includes('success') || message.includes('completed')) return 'success';
    if (message.includes('❌') || message.includes('error') || message.includes('failed')) return 'error';
    return 'info';
  };

  // Helper function to get notification icon
  const getNotificationIcon = (message: string) => {
    const type = getNotificationType(message);
    switch (type) {
      case 'order': return '🛒';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const salesTrendsData = {
    labels: data.salesTrends.map((item) => item.month),
    datasets: [
      {
        label: t('monthly_sales_trends'),
        data: data.salesTrends.map((item) => item.value),
        borderColor: '#FFD600',
        backgroundColor: 'rgba(255, 214, 0, 0.15)',
        pointBackgroundColor: '#FFD600',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  useEffect(() => {
    if (role === 'transporter') {
      setIsSidebarOpen(true);
    }
  }, [role]);

  // Fetch dashboard data and notifications
  useEffect(() => {
    fetchNotifications();
    fetchUserProfile();

    // Set up periodic notification refresh every 30 seconds
    const notificationInterval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    // Set up periodic profile refresh every 5 minutes
    const profileInterval = setInterval(() => {
      fetchUserProfile();
    }, 300000);

    return () => {
      clearInterval(notificationInterval);
      clearInterval(profileInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${darkMode ? 'bg-gray-900 text-white' : 'bg-neutral-50 text-gray-900'}`}>
      {/* Mobile Header */}
      <header className="flex justify-between items-center p-4 md:hidden">
        <button onClick={toggleSidebar}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-h2 font-bold">{t('dashboard')}</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'ne' ? 'en' : 'ne')}
            className="btn-secondary border-accent-error-600 text-accent-error-600 hover:bg-accent-error-600 hover:text-white"
          >
            {i18n.language === 'ne' ? 'Switch to English' : 'नेपालीमा स्विच गर्नुहोस्'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center p-2 rounded-full bg-accent-error-600 text-white hover:bg-accent-error-700 transition-colors duration-200"
            title={t('logout')}
          >
            <FaSignOutAlt className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0 transition-transform duration-200 ease-in-out bg-accent-success-800 text-white w-64 z-50`}>
        {role === 'transporter' ? (
          <TransporterMenu />
        ) : (
          <SidebarNav businessType={businessType} />
        )}
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black opacity-50 z-40 md:hidden" onClick={toggleSidebar}></div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        {role !== 'transporter' ? (
          <>
            <div className="hidden md:flex justify-between items-center mb-8">
              <div>
                <h1 className="text-h1 font-bold text-primary-600">
                  {profileLoading ? (
                    <div className="flex items-center space-x-2">
                      <span>Welcome, </span>
                      <div className="animate-pulse bg-gray-300 rounded h-6 w-24"></div>
                    </div>
                  ) : (
                    `Welcome, ${userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : user?.name || user?.email || 'User'}`
                  )}
                </h1>
                {userProfile && !profileLoading && (
                  <p className="text-sm text-gray-600 mt-1">
                    {userProfile.business_type.charAt(0).toUpperCase() + userProfile.business_type.slice(1)} • {userProfile.email}
                  </p>
                )}
                {profileError && (
                  <p className="text-sm text-red-600 mt-1">
                    {profileError}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {/* Notification Panel */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium border border-white">
                        {notifications.filter(n => !n.is_read).length > 9 ? '9+' : notifications.filter(n => !n.is_read).length}
                      </span>
                    )}
                  </button>

                  {isNotificationOpen && (
                    <>
                      <div
                        className="fixed inset-0 bg-black bg-opacity-25 z-40"
                        onClick={() => setIsNotificationOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-xl">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                          <div className="flex items-center gap-2">
                            {notifications.filter(n => !n.is_read).length > 0 && (
                              <button
                                onClick={markAllNotificationsAsRead}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Mark all read
                              </button>
                            )}
                            <button
                              onClick={() => setIsNotificationOpen(false)}
                              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                            >
                              <FaSignOutAlt className="h-3 w-3 text-gray-500 rotate-180" />
                            </button>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notificationsLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                              <span className="ml-2 text-sm text-gray-600">Loading notifications...</span>
                            </div>
                          ) : notificationError ? (
                            <div className="px-4 py-8 text-center text-red-600 text-sm">
                              {notificationError}
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No notifications</p>
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                                  !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                                onClick={() => markNotificationAsRead(notification.id)}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 text-lg mt-0.5">
                                    {getNotificationIcon(notification.message)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-relaxed ${
                                      !notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'
                                    }`}>
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(notification.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                  {!notification.is_read && (
                                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-xl text-center">
                            <button className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors">
                              View all notifications
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Profile/Settings Panel */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                    title="Profile & Settings"
                  >
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700 hidden sm:block">
                      {userProfile ? userProfile.first_name : user?.name?.split(' ')[0] || 'User'}
                    </span>
                  </button>

                  {isProfileOpen && (
                    <>
                      <div
                        className="fixed inset-0 bg-black bg-opacity-25 z-40"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                        {/* Profile Header */}
                        {userProfile && (
                          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <p className="font-medium text-gray-900">{userProfile.first_name} {userProfile.last_name}</p>
                            <p className="text-sm text-gray-600">{userProfile.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {userProfile.business_type.charAt(0).toUpperCase() + userProfile.business_type.slice(1)}
                              {userProfile.registered_business_name && ` • ${userProfile.registered_business_name}`}
                            </p>
                          </div>
                        )}
                        <div className="py-2">
                          <a
                            href="/user-admin-profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <User className="h-4 w-4 mr-3" />
                            Profile
                          </a>
                          {/* <a
                            href="/settings"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="h-4 w-4 mr-3" />
                            Settings
                          </a> */}
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={() => i18n.changeLanguage(i18n.language === 'ne' ? 'en' : 'ne')}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                          >
                            {i18n.language === 'ne' ? 'Switch to English' : 'नेपालीमा स्विच गर्नुहोस्'}
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                          >
                            <FaSignOutAlt className="h-4 w-4 mr-3" />
                            {t('logout')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Cards with 8-point spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <InfoCard icon={<ShoppingBag className="h-6 w-6 text-blue-600 mr-3" />} title={t('products')} value={data.totalProducts} darkMode={darkMode} />
              <InfoCard icon={<ShoppingCart className="h-6 w-6 text-green-600 mr-3" />} title={t('orders')} value={data.totalOrders} darkMode={darkMode} />
              <InfoCard icon={<BarChart3 className="h-6 w-6 text-red-600 mr-3" />} title={t('sales')} value={data.totalSales} darkMode={darkMode} />
              <InfoCard icon={<Users className="h-6 w-6 text-purple-600 mr-3" />} title={t('customers')} value={data.totalCustomers} darkMode={darkMode} />
            </div>

            {/* Quick Actions Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Only show functional buttons based on business type */}
                {(currentBusinessType === 'distributor' || currentBusinessType === 'retailer') && (
                  <a
                    href="/products"
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
                  >
                    <ShoppingBag className="h-8 w-8 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-gray-700 text-center">Add Product</span>
                  </a>
                )}
                
                {currentBusinessType === 'distributor' && (
                  <>
                    <a
                      href="/orders"
                      className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
                    >
                      <ShoppingCart className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-gray-700 text-center">View Orders</span>
                    </a>
                    <a
                      href="/customers"
                      className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
                    >
                      <Users className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-gray-700 text-center">Add Customer</span>
                    </a>
                    <a
                      href="/sales"
                      className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
                    >
                      <BarChart3 className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-gray-700 text-center">Sales Report</span>
                    </a>
                    <a
                      href="/stats"
                      className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
                    >
                      <BarChart3 className="h-8 w-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-gray-700 text-center">Analytics</span>
                    </a>
                  </>
                )}

                {currentBusinessType === 'retailer' && (
                  <>
                    <a
                      href="/sales"
                      className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
                    >
                      <BarChart3 className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-gray-700 text-center">Direct Sales</span>
                    </a>
                    <a
                      href="/stocks"
                      className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
                    >
                      <ShoppingBag className="h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-gray-700 text-center">Stock Management</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
              <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className="text-lg font-bold mb-4">{t('monthly_sales_trends')}</h2>
                <div className="h-64">
                  <Line data={salesTrendsData} options={chartOptions} />
                </div>
              </div>
              <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className="text-lg font-bold mb-4">{t('pending_orders_revenue')}</h2>
                <div className="flex flex-col space-y-4">
                  <InfoRow icon={<ShoppingCart className="h-6 w-6 text-yellow-600 mr-3" />} label={t('pending_orders')} value={data.pendingOrders} />
                  <InfoRow icon={<BarChart3 className="h-6 w-6 text-green-600 mr-3" />} label={t('total_revenue')} value={`NPR ${data.totalRevenue}`} />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className={`rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {ledgerLoading ? (
                  <p className="p-4">{t('loading_ledger_entries')}</p>
                ) : ledgerError ? (
                  <p className="text-red-600 p-4">Error: {ledgerError}</p>
                ) : (
                  <>
                    <LedgerEntriesTable entries={ledgerEntries} />
                    <div className="flex justify-between items-center mt-4 p-4">
                      <div>
                        <label htmlFor="ledger-page-size" className="mr-2">{t('rows_per_page')}</label>
                        <select
                          id="ledger-page-size"
                          value={ledgerPageSize}
                          onChange={e => {
                            setLedgerPageSize(Number(e.target.value));
                            setLedgerPage(1);
                          }}
                          className="border rounded px-2 py-1"
                        >
                          {[5, 10, 20, 50].map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <button
                          className="px-3 py-1 border rounded mr-2 disabled:opacity-50"
                          onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                          disabled={ledgerPage === 1}
                        >
                          {t('previous')}
                        </button>
                        <span>
                          {t('page')} {ledgerPage} {t('of')} {Math.ceil(ledgerCount / ledgerPageSize) || 1}
                        </span>
                        <button
                          className="px-3 py-1 border rounded ml-2 disabled:opacity-50"
                          onClick={() => setLedgerPage(p => p + 1)}
                          disabled={ledgerPage >= Math.ceil(ledgerCount / ledgerPageSize)}
                        >
                          {t('next')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <TransporterOverview
            userLabel={user?.name || user?.email || null}
            darkMode={darkMode}
            stats={tStats}
            loading={tStatsLoading}
            error={tStatsError}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
