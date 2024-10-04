import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
  ScaleIcon
} from '@heroicons/react/solid';

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
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/dashboard/`
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
    }
  }, [navigate]);

  const salesTrendsData = {
    labels: data.salesTrends.map((item) => item.month),
    datasets: [
      {
        label: 'Monthly Sales',
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
      {/* Mobile Header */}
      <header className="flex items-center justify-between bg-white p-4 md:hidden">
        <button onClick={() => setSidebarOpen(true)}>
          <MenuIcon className="h-6 w-6 text-gray-800" />
        </button>
        <h1 className="text-xl font-bold text-blue-600">Dashboard</h1>
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center focus:outline-none"
          >
            <span className="text-gray-800">{user.username}</span>
            <svg
              className="w-4 h-4 ml-1"
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
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:translate-x-0 transition-transform duration-200 ease-in-out bg-gray-900 text-white w-64 z-50`}
      >
        <div className="p-4 flex items-center justify-between md:justify-center">
          <h2 className="text-2xl font-bold">Menu</h2>
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
                Producer Management
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/products"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <ShoppingBagIcon className="h-5 w-5 mr-3" />
                Product Management
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/customers"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <UserGroupIcon className="h-5 w-5 mr-3" />
                Customer Management
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/orders"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <ShoppingCartIcon className="h-5 w-5 mr-3" />
                Order Management
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/sales"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <CurrencyDollarIcon className="h-5 w-5 mr-3" />
                Sales Management
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/stats"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <ChartSquareBarIcon className="h-5 w-5 mr-3" />
                Stats and Analytics
              </Link>
            </li>
            <li className="mb-4">
              <Link
                to="/stocks"
                className="flex items-center px-4 py-2 text-sm font-medium rounded hover:bg-gray-700"
              >
                <ScaleIcon className="h-5 w-5 mr-3" />
                Stock Management
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

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">
            Supply Chain Dashboard
          </h1>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search..."
              className="px-4 py-2 border rounded-lg"
            />
            <div className="ml-4 inline-block relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg focus:outline-none"
              >
                {user.username}
                <svg
                  className="w-4 h-4 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" />
                </svg>
              </button>

              {user.isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <ShoppingBagIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-lg font-bold">Total Products</h2>
              <p className="text-2xl">{data.totalProducts}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <ShoppingCartIcon className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h2 className="text-lg font-bold">Total Orders</h2>
              <p className="text-2xl">{data.totalOrders}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <ChartBarIcon className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h2 className="text-lg font-bold">Total Sales</h2>
              <p className="text-2xl">{data.totalSales}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <UserGroupIcon className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <h2 className="text-lg font-bold">Total Customers</h2>
              <p className="text-2xl">{data.totalCustomers}</p>
            </div>
          </div>
        </div>

        {/* Charts and Metrics */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Trends Line Chart */}
          <div className="bg-white p-4 rounded-lg shadow h-80">
            <h2 className="text-lg font-bold mb-4">
              Monthly Sales Trends (Aggregated)
            </h2>
            <div className="w-full h-64">
              <Line data={salesTrendsData} options={chartOptions} />
            </div>
          </div>

          {/* Pending Orders and Revenue */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">
              Pending Orders & Total Revenue
            </h2>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <ShoppingCartIcon className="h-6 w-6 text-yellow-600 mr-3" />
                <p>
                  Pending Orders:{' '}
                  <span className="text-2xl font-semibold">
                    {data.pendingOrders}
                  </span>
                </p>
              </div>
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 text-green-600 mr-3" />
                <p>
                  Total Revenue:{' '}
                  <span className="text-2xl font-semibold">
                    NPR {data.totalRevenue}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
