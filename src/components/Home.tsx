import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LedgerEntry, fetchLedgerEntries } from '../api/ledgerApi';
import LedgerEntriesTable from './LedgerEntriesTable';
import PurchaseOrderCards from './PurchaseOrderCards';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { Link, useNavigate } from 'react-router-dom';
import { MenuIcon, XIcon } from '@heroicons/react/outline';
import {
  ShoppingBagIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  OfficeBuildingIcon,
  CurrencyDollarIcon,
  ChartSquareBarIcon,
  ScaleIcon,
  ClipboardListIcon
} from '@heroicons/react/solid';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend
);

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
  const [user, setUser] = useState({ username: '', isDropdownOpen: false });
  const [data, setData] = useState<DashboardData>({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    totalCustomers: 0,
    salesTrends: [],
    pendingOrders: 0,
    totalRevenue: 0,
  });
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Ledger entries state
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerCount, setLedgerCount] = useState(0);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(10);

  const fetchUserInfo = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/user-info/`,
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      setUser({ ...user, username: response.data.username });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Error fetching user info',
          error.response ? error.response.data : error.message
        );
      } else {
        console.error('An unexpected error occurred:', error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleDropdown = () => {
    setUser({ ...user, isDropdownOpen: !user.isDropdownOpen });
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
      console.error('Error fetching data', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchData();
      fetchUserInfo();
      // Fetch ledger entries
      const fetchLedger = async () => {
        setLedgerLoading(true);
        const token = localStorage.getItem('token');
        if (token) {
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
        } else {
          setLedgerError('No token found');
          setLedgerLoading(false);
        }
      };
      fetchLedger();
    }
  }, [navigate, ledgerPage, ledgerPageSize]);

  const salesTrendsData = {
    labels: data.salesTrends.map((item) => item.month),
    datasets: [
      {
        label: t('monthly_sales_trends'),
        data: data.salesTrends.map((item) => item.value),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      <header className="flex items-center justify-between bg-white p-4 md:hidden w-full">
        <div className="flex items-center space-x-4">
          <button onClick={() => setSidebarOpen(true)}>
            <MenuIcon className="h-6 w-6 text-gray-800" />
          </button>
          <h1 className="text-xl font-bold text-blue-600">{t('dashboard')}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex items-center space-x-1">
            <span className="text-gray-800">{user.username}</span>
            <button onClick={toggleDropdown} className="focus:outline-none">
              <svg
                className="w-4 h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" />
              </svg>
            </button>

            {user.isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-10">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'ne' ? 'en' : 'ne')}
              className="px-2 py-1 text-xs border border-blue-600 text-blue-600 rounded-lg bg-transparent hover:bg-blue-600 hover:text-white focus:outline-none transition duration-300"
            >
              {i18n.language === 'ne' ? 'Switch to English' : 'नेपालीमा स्विच गर्नुहोस्'}
            </button>
          </div>
        </div>
      </header>



      <aside
        className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:static md:translate-x-0 transition-transform duration-200 ease-in-out bg-green-900 text-white w-64 z-50`}
      >
        <div className="p-4 flex items-center justify-between md:justify-center">
          <h2 className="text-2xl font-bold">{t('menu')}</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden focus:outline-none"
          >
            <XIcon className="h-6 w-6 text-white" />
          </button>
        </div>
        <nav>
          <ul>
            <li className="mb-4">
              <Link
                to="/producers"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <OfficeBuildingIcon className="h-5 w-5 mr-3" />
                {t('producer_management')}
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/products"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <ShoppingBagIcon className="h-5 w-5 mr-3" />
                {t('product_management')}</Link>
            </li>
            <li className="mb-4">
              <Link
                to="/customers"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <UserGroupIcon className="h-5 w-5 mr-3" />
                {t('customer_management')}
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/orders"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <ShoppingCartIcon className="h-5 w-5 mr-3" />
                {t('order_management')}
              </Link>
            </li>
          
            <li className="mb-4">
              <Link
                to="/sales"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <CurrencyDollarIcon className="h-5 w-5 mr-3" />
                {t('sales_management')}
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/purchase-orders"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <ClipboardListIcon className="h-5 w-5 mr-3" />
                Purchase Order Management
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/stats"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <ChartSquareBarIcon className="h-5 w-5 mr-3" />
                {t('stats_and_analytics')}
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/audit-logs"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <ClipboardListIcon className="h-5 w-5 mr-3" />
                {t('audit_logs')}
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/stocks"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <ScaleIcon className="h-5 w-5 mr-3" />
                {t('stock_management')}
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/marketplace"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <ScaleIcon className="h-5 w-5 mr-3" />
                {t('marketplace')}
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="flex-1 p-4 md:p-8">
        <div className="hidden md:flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-800">
            {t('supply_chain_dashboard')}
          </h1>
          
          <div className="flex items-center space-x-4">
            <form className="max-w-md mx-auto">   
                <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                    </svg>
                  </div>
                  <input 
                    type="search" 
                    id="default-search" 
                    className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                    placeholder={t('search_placeholder')} 
                    required 
                  />
                  <button 
                    type="submit" 
                    className="text-white absolute end-2.5 bottom-2.5 bg-yellow-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    {t('search')}
                  </button>
                </div>
              </form>

            <div className="relative">
              <button
                onClick={() => setUser({ ...user, isDropdownOpen: !user.isDropdownOpen })}
                className="flex items-center px-4 py-2 border border-blue-600 text-yellow-700 rounded-lg bg-transparent focus:outline-none transition duration-300"
              >
                {user.username}
                <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" />
                </svg>
              </button>

              {user.isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setUser({ ...user, isDropdownOpen: false });
                      navigate('/login');
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200"
                  >
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'ne' ? 'en' : 'ne')}
                className="px-4 py-2 border border-blue-600 text-yellow-700 rounded-lg bg-transparent focus:outline-none transition duration-300"
              >
                {i18n.language === 'ne' ? 'Switch to English' : 'नेपालीमा स्विच गर्नुहोस्'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <ShoppingBagIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-lg font-bold">{t('products')}</h2>
              <p className="text-2xl">{data.totalProducts}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <ShoppingCartIcon className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h2 className="text-lg font-bold">{t('orders')}</h2>
              <p className="text-2xl">{data.totalOrders}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <ChartBarIcon className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h2 className="text-lg font-bold">{t('sales')}</h2>
              <p className="text-2xl">{data.totalSales}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <UserGroupIcon className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <h2 className="text-lg font-bold">{t('customers')}</h2>
              <p className="text-2xl">{data.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Trends Line Chart */}
          <div className="bg-white p-4 rounded-lg shadow h-80">
            <h2 className="text-lg font-bold mb-4">{t('monthly_sales_trends')}</h2>
            <div className="w-full h-64">
              <Line data={salesTrendsData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">
              {t('pending_orders')} & {t('total_revenue')}
            </h2>
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

        {/* Purchase Order Management Section - card view
        <div id="purchase-orders" className="mt-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <ClipboardListIcon className="h-6 w-6 text-blue-600 mr-2" />
              Purchase Order Management
            </h2>
            <PurchaseOrderCards pageSize={6} />
          </div>
        </div> */}

        {/* Ledger Entries Table Section - new row below dashboard cards */}
        <div className="mt-8">
          <div className="bg-white p-4 rounded-lg shadow">
            {ledgerLoading ? (
              <p>Loading ledger entries...</p>
            ) : ledgerError ? (
              <p className="text-red-600">Error: {ledgerError}</p>
            ) : (
              <>
                <LedgerEntriesTable entries={ledgerEntries} />
                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4">
                  <div>
                    <label htmlFor="ledger-page-size" className="mr-2">Rows per page:</label>
                    <select
                      id="ledger-page-size"
                      value={ledgerPageSize}
                      onChange={e => {
                        setLedgerPageSize(Number(e.target.value));
                        setLedgerPage(1); // Reset to first page on page size change
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
                      Previous
                    </button>
                    <span>
                      Page {ledgerPage} of {Math.ceil(ledgerCount / ledgerPageSize) || 1}
                    </span>
                    <button
                      className="px-3 py-1 border rounded ml-2 disabled:opacity-50"
                      onClick={() => setLedgerPage(p => p + 1)}
                      disabled={ledgerPage >= Math.ceil(ledgerCount / ledgerPageSize)}
                    >
                      Next
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