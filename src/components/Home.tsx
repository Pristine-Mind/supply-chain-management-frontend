import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { ShoppingBagIcon, ChartBarIcon, UserGroupIcon, ShoppingCartIcon, MoonIcon, SunIcon, OfficeBuildingIcon, CurrencyDollarIcon, ChartSquareBarIcon, ScaleIcon, ClipboardListIcon } from '@heroicons/react/solid';
import { FaFirstOrder } from 'react-icons/fa';
import { fetchLedgerEntries, LedgerEntry } from '../api/ledgerApi';
import LedgerEntriesTable from './LedgerEntriesTable';

// Register ChartJS components
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
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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

  // Get business type from localStorage
  const businessType = localStorage.getItem('business_type') || 'producer';

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
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
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
  }, [navigate, ledgerPage, ledgerPageSize]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
          {/* <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
          >
            {darkMode ? <SunIcon className="h-5 w-5 text-yellow-500" /> : <MoonIcon className="h-5 w-5 text-gray-800" />}
          </button> */}
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
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Menu</h2>
          <button onClick={toggleSidebar} className="md:hidden">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-4">
            {businessType === 'retailer' ? (
              // Retailer specific menu
              <>
                <li>
                  <a href="/producers" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <OfficeBuildingIcon className="h-5 w-5 mr-3" />
                    <span>{t('producer_management')}</span>
                  </a>
                </li>
                <li>
                  <a href="/products" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <ShoppingBagIcon className="h-5 w-5 mr-3" />
                    <span>{t('product_management')}</span>
                  </a>
                </li>
                <li>
                  <a href="/sales" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <CurrencyDollarIcon className="h-5 w-5 mr-3" />
                    <span>Direct Sales</span>
                  </a>
                </li>
                <li>
                  <a href="/stocks" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <ScaleIcon className="h-5 w-5 mr-3" />
                    <span>{t('stock_management')}</span>
                  </a>
                </li>
              </>
            ) : (
              // Original menu for other business types
              <>
                <li>
                  <a href="/producers" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <OfficeBuildingIcon className="h-5 w-5 mr-3" />
                    <span>{t('producer_management')}</span>
                  </a>
                </li>
                <li>
                  <a href="/products" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <ShoppingBagIcon className="h-5 w-5 mr-3" />
                    <span>{t('product_management')}</span>
                  </a>
                </li>
                <li>
                  <a href="/customers" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <UserGroupIcon className="h-5 w-5 mr-3" />
                    <span>{t('customer_management')}</span>
                  </a>
                </li>
                <li>
                  <a href="/orders" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <FaFirstOrder className="h-5 w-5 mr-3" />
                    <span>{t('order_management')}</span>
                  </a>
                </li>
                <li>
                  <a href="/purchase-orders" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <ClipboardListIcon className="h-5 w-5 mr-3" />
                    <span>Purchase Order Management</span>
                  </a>
                </li>
                <li>
                  <a href="/sales" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <CurrencyDollarIcon className="h-5 w-5 mr-3" />
                    <span>{t('sales_management')}</span>
                  </a>
                </li>
                <li>
                  <a href="/stats" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <ChartSquareBarIcon className="h-5 w-5 mr-3" />
                    <span>{t('stats_and_analytics')}</span>
                  </a>
                </li>
                <li>
                  <a href="/audit-logs" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <ClipboardListIcon className="h-5 w-5 mr-3" />
                    <span>{t('audit_logs')}</span>
                  </a>
                </li>
                <li>
                  <a href="/stocks" className="flex items-center p-2 rounded hover:bg-green-700 transition-transform transform hover:scale-105">
                    <ScaleIcon className="h-5 w-5 mr-3" />
                    <span>{t('stock_management')}</span>
                  </a>
                </li>
              </>
            )}
          </ul>
        </nav>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black opacity-50 z-40 md:hidden" onClick={toggleSidebar}></div>
      )}

      <div className="flex-1 p-4 md:p-8">
        <div className="hidden md:flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-800">
            Welcome, {localStorage.getItem('username') || 'User'}
          </h1>
          <div className="flex items-center space-x-4">
            {/* <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              {darkMode ? <SunIcon className="h-5 w-5 text-yellow-500" /> : <MoonIcon className="h-5 w-5 text-gray-800" />}
            </button> */}
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <ShoppingBagIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h2 className="text-lg font-bold">{t('products')}</h2>
                <p className="text-2xl">{data.totalProducts}</p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <ShoppingCartIcon className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h2 className="text-lg font-bold">{t('orders')}</h2>
                <p className="text-2xl">{data.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <ChartBarIcon className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h2 className="text-lg font-bold">{t('sales')}</h2>
                <p className="text-2xl">{data.totalSales}</p>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <UserGroupIcon className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <h2 className="text-lg font-bold">{t('customers')}</h2>
                <p className="text-2xl">{data.totalCustomers}</p>
              </div>
            </div>
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
              <div className="flex items-center">
                <ShoppingCartIcon className="h-6 w-6 text-yellow-600 mr-3" />
                <p>
                  {t('pending_orders')}: <span className="text-2xl font-semibold">{data.pendingOrders}</span>
                </p>
              </div>
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 text-green-600 mr-3" />
                <p>
                  {t('total_revenue')}: <span className="text-2xl font-semibold">NPR {data.totalRevenue}</span>
                </p>
              </div>
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
      </div>
    </div>
  );
};

export default Home;
