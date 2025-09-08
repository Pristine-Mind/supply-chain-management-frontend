import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBagIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/solid';

import { fetchLedgerEntries, LedgerEntry } from '../api/ledgerApi';
import { getTransporterStats, type TransporterStats } from '../api/transporterApi';
import TransporterMenu from './TransporterMenu';
import LedgerEntriesTable from './LedgerEntriesTable';
import SidebarNav from './dashboard/SidebarNav';
import TransporterOverview from './dashboard/TransporterOverview';
import { InfoCard, InfoRow } from './dashboard/InfoBlocks';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
  const [darkMode, setDarkMode] = useState(false);
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

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate('/login');
    } else {
      if (
        user &&
        user.hasAccessToMarketplace === false &&
        user.businessType === null &&
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <header className="flex justify-between items-center p-4 md:hidden">
        <button onClick={toggleSidebar}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'ne' ? 'en' : 'ne')}
            className="px-4 py-2 border border-red-600 text-red-600 rounded-lg bg-transparent hover:bg-red-600 hover:text-white focus:outline-none transition duration-300"
          >
            {i18n.language === 'ne' ? 'Switch to English' : 'नेपालीमा स्विच गर्नुहोस्'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
            title={t('logout')}
          >
            <FaSignOutAlt className="h-5 w-5" />
          </button>
        </div>
      </header>

      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0 transition-transform duration-200 ease-in-out bg-green-900 text-white w-64 z-50`}>
        {/* <div className="p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Menu</h2>
          <button onClick={toggleSidebar} className="md:hidden">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div> */}
        {role === 'transporter' ? (
          <TransporterMenu />
        ) : (
          <SidebarNav businessType={businessType} />
        )}
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black opacity-50 z-40 md:hidden" onClick={toggleSidebar}></div>
      )}

      <div className="flex-1 p-4 md:p-8">
        {role !== 'transporter' ? (
          <>
            <div className="hidden md:flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-yellow-800">
                Welcome, {user?.name || user?.email || 'User'}
              </h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => i18n.changeLanguage(i18n.language === 'ne' ? 'en' : 'ne')}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-lg bg-transparent hover:bg-red-600 hover:text-white"
                >
                  {i18n.language === 'ne' ? 'Switch to English' : 'नेपालीमा स्विच गर्नुहोस्'}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center p-2 rounded-full bg-red-600 text-white hover:bg-red-700"
                  title={t('logout')}
                >
                  <FaSignOutAlt className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoCard icon={<ShoppingBagIcon className="h-6 w-6 text-blue-600 mr-3" />} title={t('products')} value={data.totalProducts} darkMode={darkMode} />
              <InfoCard icon={<ShoppingCartIcon className="h-6 w-6 text-green-600 mr-3" />} title={t('orders')} value={data.totalOrders} darkMode={darkMode} />
              <InfoCard icon={<ChartBarIcon className="h-6 w-6 text-red-600 mr-3" />} title={t('sales')} value={data.totalSales} darkMode={darkMode} />
              <InfoCard icon={<UserGroupIcon className="h-6 w-6 text-purple-600 mr-3" />} title={t('customers')} value={data.totalCustomers} darkMode={darkMode} />
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
                  <InfoRow icon={<ShoppingCartIcon className="h-6 w-6 text-yellow-600 mr-3" />} label={t('pending_orders')} value={data.pendingOrders} />
                  <InfoRow icon={<ChartBarIcon className="h-6 w-6 text-green-600 mr-3" />} label={t('total_revenue')} value={`NPR ${data.totalRevenue}`} />
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
