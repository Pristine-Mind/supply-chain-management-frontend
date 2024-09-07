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
import { useNavigate } from 'react-router-dom';
import { ShoppingBagIcon, ChartBarIcon, UserGroupIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Home: React.FC = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({ username: '', isDropdownOpen: false });
  
  const [data, setData] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    totalCustomers: 0,
    salesTrends: [],
    pendingOrders: 0,
    totalRevenue: 0
  });

  const fetchUserInfo = async () => {
    const token = localStorage.getItem('token');
    console.log(token, "storage");

    if (!token) {
        console.error('No token found in localStorage');
        return;
    }

    try {
        const response = await axios.get('http://localhost:8000/api/v1/user-info/', {
            headers: { Authorization: `Token ${token}` }
        });
        setUser({ ...user, username: response.data.username });
    } catch (error) {
        console.error('Error fetching user info', error.response ? error.response.data : error.message);
    }
    };


  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Toggle the dropdown menu
  const toggleDropdown = () => {
    setUser({ ...user, isDropdownOpen: !user.isDropdownOpen });
  };

  // Fetch Dashboard Data
  const fetchData = async () => {
    try {
      // Replace this with your API endpoint
      const response = await axios.get('http://localhost:8000/api/v1/dashboard/');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  // Check for authentication and fetch data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchData();
      fetchUserInfo();
    }
  }, [navigate]);

  // Data for the sales trends line chart (monthly sales data)
  const salesTrendsData = {
    labels: data.salesTrends.map((item: any) => item.month),
    datasets: [
      {
        label: 'Monthly Sales',
        data: data.salesTrends.map((item: any) => item.value),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Supply Chain Dashboard</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="px-4 py-2 border rounded-lg"
          />
          <div className="ml-4 inline-block relative">
            <button
              onClick={toggleDropdown}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg focus:outline-none"
            >
              {user.username} ▼
            </button>

            {user.isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                <a
                  href="#"
                  onClick={handleLogout}
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Monthly Sales Trends (Aggregated)</h2>
          <Line data={salesTrendsData} />
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Pending Orders & Total Revenue</h2>
          <p>Pending Orders: {data.pendingOrders}</p>
          <p>Total Revenue: ${data.totalRevenue}</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
