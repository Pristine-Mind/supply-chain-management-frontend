import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaFirstOrder } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBagIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  MoonIcon,
  SunIcon,
  OfficeBuildingIcon,
  CurrencyDollarIcon,
  ChartSquareBarIcon,
  ScaleIcon,
  ClipboardListIcon
} from '@heroicons/react/solid';

import { fetchLedgerEntries, LedgerEntry } from '../api/ledgerApi';
import TransporterMenu from './TransporterMenu';
import LedgerEntriesTable from './LedgerEntriesTable';

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
  const { isAuthenticated, user, logout } = useAuth();
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

  const businessType = user?.businessType || localStorage.getItem('business_type') || 'producer';
  const role = user?.role || localStorage.getItem('role') || 'producer';

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerCount, setLedgerCount] = useState(0);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(10);

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
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      // Check if user has access to business dashboard
      if (user && user.hasAccessToMarketplace === false && user.businessType === null) {
        // General user - redirect to marketplace home
        navigate('/');
        return;
      }
      
      // Check role-based access
      const token = localStorage.getItem('token');
      if (!role && !businessType) {
        // No role or business type - redirect general users
        navigate('/');
        return;
      }
      
      // Valid business user - load dashboard data
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
        }
      }
    }
  }, [isAuthenticated, user, navigate, ledgerPage, ledgerPageSize, role, businessType]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
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
          <nav className="p-4">
            <ul className="space-y-4">
              {businessType === 'retailer' ? (
                <>
                  <li><a href="/producers" className="flex items-center p-2 rounded hover:bg-green-700"><OfficeBuildingIcon className="h-5 w-5 mr-3" />{t('producer_management')}</a></li>
                  <li><a href="/products" className="flex items-center p-2 rounded hover:bg-green-700"><ShoppingBagIcon className="h-5 w-5 mr-3" />{t('product_management')}</a></li>
                  <li><a href="/sales" className="flex items-center p-2 rounded hover:bg-green-700"><CurrencyDollarIcon className="h-5 w-5 mr-3" />Direct Sales</a></li>
                  <li><a href="/stocks" className="flex items-center p-2 rounded hover:bg-green-700"><ScaleIcon className="h-5 w-5 mr-3" />{t('stock_management')}</a></li>
                </>
              ) : businessType === 'distributor' ? (
                <>
                  <li><a href="/producers" className="flex items-center p-2 rounded hover:bg-green-700"><OfficeBuildingIcon className="h-5 w-5 mr-3" />{t('producer_management')}</a></li>
                  <li><a href="/retailers" className="flex items-center p-2 rounded hover:bg-green-700"><UserGroupIcon className="h-5 w-5 mr-3" />Retailer Management</a></li>
                  <li><a href="/products" className="flex items-center p-2 rounded hover:bg-green-700"><ShoppingBagIcon className="h-5 w-5 mr-3" />{t('product_management')}</a></li>
                  <li><a href="/orders" className="flex items-center p-2 rounded hover:bg-green-700"><FaFirstOrder className="h-5 w-5 mr-3" />{t('order_management')}</a></li>
                  <li><a href="/purchase-orders" className="flex items-center p-2 rounded hover:bg-green-700"><ClipboardListIcon className="h-5 w-5 mr-3" />Purchase Order Management</a></li>
                  <li><a href="/distribution" className="flex items-center p-2 rounded hover:bg-green-700"><ScaleIcon className="h-5 w-5 mr-3" />Distribution Management</a></li>
                  <li><a href="/sales" className="flex items-center p-2 rounded hover:bg-green-700"><CurrencyDollarIcon className="h-5 w-5 mr-3" />{t('sales_management')}</a></li>
                  <li><a href="/stocks" className="flex items-center p-2 rounded hover:bg-green-700"><ScaleIcon className="h-5 w-5 mr-3" />{t('stock_management')}</a></li>
                  <li><a href="/stats" className="flex items-center p-2 rounded hover:bg-green-700"><ChartSquareBarIcon className="h-5 w-5 mr-3" />{t('stats_and_analytics')}</a></li>
                </>
              ) : (
                <>
                  <li><a href="/producers" className="flex items-center p-2 rounded hover:bg-green-700"><OfficeBuildingIcon className="h-5 w-5 mr-3" />{t('producer_management')}</a></li>
                  <li><a href="/products" className="flex items-center p-2 rounded hover:bg-green-700"><ShoppingBagIcon className="h-5 w-5 mr-3" />{t('product_management')}</a></li>
                  <li><a href="/customers" className="flex items-center p-2 rounded hover:bg-green-700"><UserGroupIcon className="h-5 w-5 mr-3" />{t('customer_management')}</a></li>
                  <li><a href="/orders" className="flex items-center p-2 rounded hover:bg-green-700"><FaFirstOrder className="h-5 w-5 mr-3" />{t('order_management')}</a></li>
                  <li><a href="/purchase-orders" className="flex items-center p-2 rounded hover:bg-green-700"><ClipboardListIcon className="h-5 w-5 mr-3" />Purchase Order Management</a></li>
                  <li><a href="/sales" className="flex items-center p-2 rounded hover:bg-green-700"><CurrencyDollarIcon className="h-5 w-5 mr-3" />{t('sales_management')}</a></li>
                  <li><a href="/stats" className="flex items-center p-2 rounded hover:bg-green-700"><ChartSquareBarIcon className="h-5 w-5 mr-3" />{t('stats_and_analytics')}</a></li>
                  <li><a href="/audit-logs" className="flex items-center p-2 rounded hover:bg-green-700"><ClipboardListIcon className="h-5 w-5 mr-3" />{t('audit_logs')}</a></li>
                  <li><a href="/stocks" className="flex items-center p-2 rounded hover:bg-green-700"><ScaleIcon className="h-5 w-5 mr-3" />{t('stock_management')}</a></li>
                </>
              )}
            </ul>
          </nav>
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
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-yellow-800 mb-4">
                Welcome, {user?.name || user?.email || 'Transporter'}
              </h1>
              <p className="text-lg text-gray-600">
                Use the menu to access your transporter features.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoCard = ({ icon, title, value, darkMode }: any) => (
  <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
    <div className="flex items-center">
      {icon}
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-2xl">{value}</p>
      </div>
    </div>
  </div>
);

const InfoRow = ({ icon, label, value }: any) => (
  <div className="flex items-center">
    {icon}
    <p>
      {label}: <span className="text-2xl font-semibold">{value}</span>
    </p>
  </div>
);

export default Home;
