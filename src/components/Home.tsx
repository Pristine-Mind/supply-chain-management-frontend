import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  BarChart3,
  Users,
  ShoppingCart,
  Bell,
  User,
  Menu,
} from 'lucide-react';

import { fetchLedgerEntries, LedgerEntry } from '../api/ledgerApi';
import { getTransporterStats, type TransporterStats } from '../api/transporterApi';
import TransporterMenu from './TransporterMenu';
import LedgerEntriesTable from './LedgerEntriesTable';
import SidebarNav from './dashboard/SidebarNav';
import TransporterOverview from './dashboard/TransporterOverview';
import { InfoCard, InfoRow } from './dashboard/InfoBlocks';
import B2BSearch from './b2b/B2BSearch';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

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
  const { isAuthenticated, user, logout, loading: authLoading } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showB2BSearch, setShowB2BSearch] = useState(false);

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

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const currentBusinessType = userProfile?.business_type || user?.businessType || businessType;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
      console.error('Error fetching dashboard data', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await axios.get<Notification[]>(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/notifications/`,
        { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
      );
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/user-profile/`,
        { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
      );
      setUserProfile(response.data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const markNotificationAsRead = async (id: number) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/notifications/${id}/`,
        { is_read: true },
        { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
      );
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(
      unread.map(n =>
        axios.patch(
          `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/notifications/${n.id}/`,
          { is_read: true },
          { headers: { Authorization: `Token ${localStorage.getItem('token')}` } }
        )
      )
    );
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || (!role && !businessType)) {
      navigate('/');
      return;
    }

    if (role !== 'transporter') {
      fetchData();
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
      const fetchTStats = async () => {
        setTStatsLoading(true);
        try {
          const stats = await getTransporterStats();
          setTStats(stats);
        } catch (e: any) {
          setTStatsError(e.message || 'Failed to load stats');
        } finally {
          setTStatsLoading(false);
        }
      };
      fetchTStats();
    }

    fetchNotifications();
    fetchUserProfile();

    const notifInterval = setInterval(fetchNotifications, 30000);
    const profileInterval = setInterval(fetchUserProfile, 300000);

    return () => {
      clearInterval(notifInterval);
      clearInterval(profileInterval);
    };
  }, [isAuthenticated, authLoading, navigate, ledgerPage, ledgerPageSize, role, businessType]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const salesTrendsData = {
    labels: data.salesTrends.map(item => item.month),
    datasets: [
      {
        label: t('monthly_sales_trends'),
        data: data.salesTrends.map(item => item.value),
        borderColor: '#FFD600',
        backgroundColor: 'rgba(255, 214, 0, 0.15)',
        pointBackgroundColor: '#FFD600',
        pointBorderColor: '#fff',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Global custom animations (add this in your globals.css or tailwind base) */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.7s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.5s ease-out;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 lg:w-auto bg-orange-700 text-white flex flex-col transition-all duration-500 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
        >
          <div className="p-5 border-b border-orange-600 flex items-center justify-between">
            <h2 className={`font-bold text-xl transition-opacity ${isCollapsed ? 'lg:opacity-0' : 'opacity-100'}`}>
              Dashboard
            </h2>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-2 hover:bg-orange-600 rounded-lg transition"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          {role === 'transporter' ? (
            <TransporterMenu />
          ) : (
            <SidebarNav businessType={businessType} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Menu className="h-6 w-6" />
            </button>

            <h1 className="text-2xl font-bold text-gray-900 animate-slideDown">{t('dashboard')}</h1>

            <div className="flex items-center gap-4">
              {/* Language Switch */}
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'ne' ? 'en' : 'ne')}
                className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {i18n.language === 'ne' ? 'EN' : 'ने'}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-3 hover:bg-gray-100 rounded-xl transition"
                >
                  <Bell className="h-5 w-5 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-none">Notifications</h3>
                      <p className="text-xs text-gray-500 mt-1">You have {unreadCount} unread messages</p>
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsAsRead} 
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List Body */}
                  <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                    {notificationsLoading ? (
                      <div className="flex flex-col items-center justify-center p-12 space-y-3">
                        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Fetching updates...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
                          <span className="text-2xl text-gray-300">🔔</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">All caught up!</p>
                        <p className="text-xs text-gray-500 mt-1">No new notifications at the moment.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="group relative p-5 hover:bg-slate-50 cursor-pointer transition-all duration-200 flex gap-4"
                          >
                            {/* Unread Indicator Dot */}
                            {!notif.is_read && (
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                            )}
                            
                            <div className="flex-1">
                              <p className={`text-sm leading-snug ${!notif.is_read ? 'text-gray-900 font-semibold' : 'text-gray-600 font-normal'}`}>
                                {notif.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                  {new Date(notif.created_at).toLocaleDateString()}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="text-[11px] text-gray-400">
                                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Link (Optional) */}
                  <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                    <button className="text-xs font-medium text-gray-500 hover:text-gray-700">
                      View all activity
                    </button>
                  </div>
                </div>
              )}
              </div>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl transition"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                    {userProfile?.first_name?.[0] || user?.name?.[0] || 'U'}
                  </div>
                  <span className="hidden md:block font-medium text-gray-700">
                    {userProfile?.first_name || user?.name?.split(' ')[0] || 'User'}
                  </span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                    <div className="p-5 bg-gradient-to-r from-orange-50 to-orange-100">
                      <p className="font-semibold text-gray-900">
                        {userProfile?.first_name} {userProfile?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{userProfile?.email}</p>
                    </div>
                    <div className="p-3 space-y-1">
                      <a href="/user-admin-profile" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition">
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                      </a>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 transition"
                      >
                        <FaSignOutAlt className="h-5 w-5" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
            {role !== 'transporter' ? (
              <>
                {/* Welcome Section */}
                <div className="mb-10 animate-fadeIn">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {profileLoading ? '...' : userProfile?.first_name || 'User'} 👋
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {currentBusinessType && `${currentBusinessType.charAt(0).toUpperCase() + currentBusinessType.slice(1)} Dashboard`}
                  </p>
                </div>

                {/* Stats Grid with Staggered Animation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  {[
                    { icon: <ShoppingBag className="h-7 w-7" />, title: t('products'), value: data.totalProducts },
                    { icon: <ShoppingCart className="h-7 w-7" />, title: t('orders'), value: data.totalOrders },
                    { icon: <BarChart3 className="h-7 w-7" />, title: t('sales'), value: data.totalSales },
                    { icon: <Users className="h-7 w-7" />, title: t('customers'), value: data.totalCustomers },
                  ].map((card, idx) => (
                    <div
                      key={idx}
                      className="animate-fadeIn opacity-0"
                      style={{ animationDelay: `${idx * 150}ms` }}
                    >
                      <InfoCard icon={card.icon} title={card.title} value={card.value} />
                    </div>
                  ))}
                </div>

                {/* Quick Actions - Fully Restored & Ultra Smooth */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-10 animate-fadeIn">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 animate-slideDown">Quick Actions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {/* Add Product - Distributor & Retailer */}
                    {(currentBusinessType === 'distributor' || currentBusinessType === 'retailer') && (
                      <a
                        href="/products"
                        className="group text-center transform transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
                      >
                        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-500">
                          <ShoppingBag className="h-12 w-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                          <p className="text-sm font-semibold text-gray-800">Add Product</p>
                        </div>
                      </a>
                    )}

                    {/* Find Business - Distributor Only */}
                    {currentBusinessType === 'distributor' && (
                      <button
                        onClick={() => setShowB2BSearch(true)}
                        className="group text-center transform transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
                      >
                        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl group-hover:from-purple-100 group-hover:to-purple-200 transition-all duration-500">
                          <Users className="h-12 w-12 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                          <p className="text-sm font-semibold text-gray-800">Find Business</p>
                        </div>
                      </button>
                    )}

                    {/* View Orders - Distributor */}
                    {currentBusinessType === 'distributor' && (
                      <a
                        href="/orders"
                        className="group text-center transform transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
                      >
                        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl group-hover:from-green-100 group-hover:to-green-200 transition-all duration-500">
                          <ShoppingCart className="h-12 w-12 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                          <p className="text-sm font-semibold text-gray-800">View Orders</p>
                        </div>
                      </a>
                    )}

                    {/* Add Customer - Distributor */}
                    {currentBusinessType === 'distributor' && (
                      <a
                        href="/customers"
                        className="group text-center transform transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
                      >
                        <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl group-hover:from-indigo-100 group-hover:to-indigo-200 transition-all duration-500">
                          <Users className="h-12 w-12 text-indigo-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                          <p className="text-sm font-semibold text-gray-800">Add Customer</p>
                        </div>
                      </a>
                    )}

                    {/* Sales Report - Distributor */}
                    {currentBusinessType === 'distributor' && (
                      <a
                        href="/sales"
                        className="group text-center transform transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
                      >
                        <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl group-hover:from-red-100 group-hover:to-red-200 transition-all duration-500">
                          <BarChart3 className="h-12 w-12 text-red-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                          <p className="text-sm font-semibold text-gray-800">Sales Report</p>
                        </div>
                      </a>
                    )}

                    {/* Analytics - Distributor */}
                    {currentBusinessType === 'distributor' && (
                      <a
                        href="/stats"
                        className="group text-center transform transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
                      >
                        <div className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl group-hover:from-teal-100 group-hover:to-teal-200 transition-all duration-500">
                          <BarChart3 className="h-12 w-12 text-teal-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                          <p className="text-sm font-semibold text-gray-800">Analytics</p>
                        </div>
                      </a>
                    )}

                    {/* Direct Sales - Retailer */}
                    {currentBusinessType === 'retailer' && (
                      <a
                        href="/sales"
                        className="group text-center transform transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
                      >
                        <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl group-hover:from-emerald-100 group-hover:to-emerald-200 transition-all duration-500">
                          <BarChart3 className="h-12 w-12 text-emerald-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                          <p className="text-sm font-semibold text-gray-800">Direct Sales</p>
                        </div>
                      </a>
                    )}

                    {/* Stock Management - Retailer */}
                    {currentBusinessType === 'retailer' && (
                      <a
                        href="/stocks"
                        className="group text-center transform transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
                      >
                        <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl group-hover:from-orange-100 group-hover:to-orange-200 transition-all duration-500">
                          <ShoppingBag className="h-12 w-12 text-orange-600 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                          <p className="text-sm font-semibold text-gray-800">Stock Management</p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>

                {/* B2B Search Modal */}
                {showB2BSearch && <B2BSearch open={showB2BSearch} onClose={() => setShowB2BSearch(false)} />}

                {/* Charts & Pending Info */}
                <div className="grid lg:grid-cols-2 gap-8 mb-10">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-fadeIn">
                    <h3 className="text-lg font-bold mb-4">{t('monthly_sales_trends')}</h3>
                    <div className="h-80">
                      <Line data={salesTrendsData} options={chartOptions} />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6 animate-fadeIn">
                    <h3 className="text-lg font-bold">{t('pending_orders_revenue')}</h3>
                    <InfoRow icon={<ShoppingCart className="h-8 w-8 text-orange-600" />} label={t('pending_orders')} value={data.pendingOrders} />
                    <InfoRow icon={<BarChart3 className="h-8 w-8 text-green-600" />} label={t('total_revenue')} value={`NPR ${data.totalRevenue.toLocaleString()}`} />
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold">Ledger Entries</h3>
                  </div>
                  {ledgerLoading ? (
                    <div className="p-10 text-center text-gray-500">Loading entries...</div>
                  ) : ledgerError ? (
                    <div className="p-10 text-center text-red-600">{ledgerError}</div>
                  ) : (
                    <>
                      <LedgerEntriesTable entries={ledgerEntries} />
                      {/* Pagination */}
                      <div className="flex justify-between items-center p-6 border-t border-gray-200">
                        <div>
                          <label htmlFor="page-size" className="mr-2">Rows per page</label>
                          <select
                            id="page-size"
                            value={ledgerPageSize}
                            onChange={(e) => {
                              setLedgerPageSize(Number(e.target.value));
                              setLedgerPage(1);
                            }}
                            className="border rounded px-3 py-1"
                          >
                            {[5, 10, 20, 50].map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                            disabled={ledgerPage === 1}
                            className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50 transition"
                          >
                            Previous
                          </button>
                          <span className="text-sm">
                            Page {ledgerPage} of {Math.ceil(ledgerCount / ledgerPageSize) || 1}
                          </span>
                          <button
                            onClick={() => setLedgerPage(p => p + 1)}
                            disabled={ledgerPage >= Math.ceil(ledgerCount / ledgerPageSize)}
                            className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50 transition"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <TransporterOverview
                userLabel={user?.name || user?.email || null}
                stats={tStats}
                loading={tStatsLoading}
                error={tStatsError}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default Home;
