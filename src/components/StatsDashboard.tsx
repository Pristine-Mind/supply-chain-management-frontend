import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { useTranslation } from 'react-i18next';

interface TopCustomer {
  order__customer__name: string;
  order__customer__city: string;
  total_spent: number;
}

interface TopProduct {
  order__product__name: string;
  total_sold: number;
}

interface TopCategory {
  order__product__category: string;
  total_sold: number;
}

interface MonthlySale {
  month: string;
  total_sold: number;
}

interface StatsResponse {
  total_products_sold: number | null;
  total_revenue: number | null;
  top_customers: TopCustomer[];
  top_products: TopProduct[];
  top_categories: TopCategory[];
  monthly_sales: MonthlySale[];
}

const categoryOptions = [
  { value: 'FA', label: 'Fashion & Apparel' },
  { value: 'EG', label: 'Electronics & Gadgets' },
  { value: 'GE', label: 'Groceries & Essentials' },
  { value: 'HB', label: 'Health & Beauty' },
  { value: 'HL', label: 'Home & Living' },
  { value: 'TT', label: 'Travel & Tourism' },
  { value: 'IS', label: 'Industrial Supplies' },
  { value: 'OT', label: 'Other' },
];

const chartColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
];

const StatsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [noData, setNoData] = useState<boolean>(false);
  const [location, setLocation] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchStats = async (): Promise<void> => {
    setLoading(true);
    setNoData(false);

    const params: any = {};
    if (location) params.location = location;
    if (category) params.category = category;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/stats/`,
        {
          params,
          headers: { Authorization: `Token ${localStorage.getItem('token')}` },
        }
      );
      const { total_products_sold, total_revenue, top_customers, top_products, top_categories, monthly_sales } = response.data;

      if (
        (total_products_sold === null || total_products_sold === 0) &&
        (total_revenue === null || total_revenue === 0) &&
        top_customers.length === 0 &&
        top_products.length === 0 &&
        top_categories.length === 0 &&
        monthly_sales.length === 0
      ) {
        setNoData(true);
        setStats(null);
      } else {
        setStats(response.data);
      }
    } catch (error) {
      console.error(t('error_fetching_stats'), error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApplyFilters = () => {
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (noData || !stats) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        {t('no_data_available')}
      </div>
    );
  }

  const { total_products_sold, total_revenue, top_customers, top_products, top_categories, monthly_sales } = stats;

  const monthlySalesData = {
    labels: monthly_sales.map((sale) =>
      new Date(sale.month).toLocaleString('default', { month: 'short', year: 'numeric' })
    ),
    datasets: [
      {
        label: t('products_sold'),
        data: monthly_sales.map((sale) => sale.total_sold),
        backgroundColor: 'rgba(255, 214, 0, 0.15)',
        borderColor: '#FFD600',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#FFD600',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      },
    ],
  };

  const topProductsPieData = {
    labels: top_products.map((product) => product.order__product__name),
    datasets: [
      {
        data: top_products.map((product) => product.total_sold),
        backgroundColor: chartColors.slice(0, top_products.length),
      },
    ],
  };

  const topCategoriesPieData = {
    labels: top_categories.map((category) => category.order__product__category),
    datasets: [
      {
        data: top_categories.map((category) => category.total_sold),
        backgroundColor: chartColors.slice(0, top_categories.length),
      },
    ],
  };

  const topCustomersPieData = {
    labels: top_customers.map((customer) => customer.order__customer__name),
    datasets: [
      {
        data: top_customers.map((customer) => customer.total_spent),
        backgroundColor: chartColors.slice(0, top_customers.length),
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: { size: 12 },
        },
      },
    },
  };

  const lineChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-orange-600 to-orange-500 text-transparent bg-clip-text">
        {t('sales_statistics_dashboard')}
      </h1>

      <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('filters')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('location')}</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('enter_location')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('category')}</label>
            <select
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{t('all_categories')}</option>
              {categoryOptions.map((categoryOption) => (
                <option key={categoryOption.value} value={categoryOption.value}>
                  {t(categoryOption.label.toLowerCase())}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('start_date')}</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{t('end_date')}</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={handleApplyFilters}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-teal-600 transition-all text-sm"
          >
            {t('apply_filters')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <h3 className="text-lg font-medium mb-2">{t('total_products_sold')}</h3>
          <p className="text-3xl font-bold">
            {total_products_sold !== null ? total_products_sold.toLocaleString() : t('na')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
          <h3 className="text-lg font-medium mb-2">{t('total_revenue')}</h3>
          <p className="text-3xl font-bold">
            {total_revenue !== null ? `$${total_revenue.toFixed(2)}` : t('na')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">{t('top_products')}</h2>
          {top_products.length > 0 ? (
            <div className="w-full h-80">
              <Pie data={topProductsPieData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm">{t('no_data_available_for_top_products')}</p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">{t('top_customers')}</h2>
          {top_customers.length > 0 ? (
            <div className="w-full h-80">
              <Pie data={topCustomersPieData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm">{t('no_data_available_for_top_customers')}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">{t('top_categories')}</h2>
        {top_categories.length > 0 ? (
          <div className="w-full h-80">
            <Pie data={topCategoriesPieData} options={chartOptions} />
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm">{t('no_data_available_for_top_categories')}</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('monthly_sales')}</h2>
        {monthly_sales.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-full h-80">
              <Line data={monthlySalesData} options={lineChartOptions} />
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">{t('no_data_available_for_monthly_sales')}</p>
        )}
      </div>
    </div>
  );
};

export default StatsDashboard;