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
  { value: 'FR', label: 'Fruits' },
  { value: 'VG', label: 'Vegetables' },
  { value: 'GR', label: 'Grains & Cereals' },
  { value: 'PL', label: 'Pulses & Legumes' },
  { value: 'SP', label: 'Spices & Herbs' },
  { value: 'NT', label: 'Nuts & Seeds' },
  { value: 'DF', label: 'Dairy & Animal Products' },
  { value: 'FM', label: 'Fodder & Forage' },
  { value: 'FL', label: 'Flowers & Ornamental Plants' },
  { value: 'HR', label: 'Herbs & Medicinal Plants' },
  { value: 'OT', label: 'Other' },
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

  // Refactored fetchStats using async/await
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
      console.log(response,"ddddd")
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
      // Optionally, you can set an error state here to display an error message to users
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    fetchStats();
  };

  if (loading) {
    return <div className="text-center py-4">{t('loading')}</div>; // Reduced padding
  }

  if (noData || !stats) {
    return <div className="text-center py-4">{t('no_data_available')}</div>; // Reduced padding
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
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: true,
      },
    ],
  };

  const chartColors = ['#FFA07A', '#FFD700', '#87CEEB', '#98FB98', '#B0C4DE', '#FFB6C1', '#20B2AA', '#FF6347'];

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
        display: false, // Hide legend for smaller charts if needed
      },
    },
  };

  return (
    <div className="container mx-auto p-4"> {/* Reduced padding */}
      <h1 className="text-2xl font-bold text-center mb-4">{t('sales_statistics_dashboard')}</h1> {/* Smaller heading */}

      {/* Filter Section */}
      <div className="p-3 mb-4 bg-gray-100 rounded-lg shadow-md"> {/* Reduced padding */}
        <h2 className="text-xl font-bold mb-3">{t('filters')}</h2> {/* Smaller heading */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2"> {/* Reduced grid columns and gap */}
          <div>
            <label className="block font-semibold mb-1 text-sm">{t('location')}</label> {/* Smaller text */}
            <input
              type="text"
              className="w-full p-1 border rounded-lg text-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('enter_location')}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-sm">{t('category')}</label> {/* Smaller text */}
            <select
              className="w-full p-1 border rounded-lg text-sm"
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
            <label className="block font-semibold mb-1 text-sm">{t('start_date')}</label> {/* Smaller text */}
            <input
              type="date"
              className="w-full p-1 border rounded-lg text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-sm">{t('end_date')}</label> {/* Smaller text */}
            <input
              type="date"
              className="w-full p-1 border rounded-lg text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-2 text-right"> {/* Reduced margin-top */}
          <button
            onClick={handleApplyFilters}
            className="px-3 py-1 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 text-sm"
          >
            {t('apply_filters')}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-blue-100 rounded-lg text-center shadow-md"> {/* Reduced padding */}
          <h3 className="text-lg font-semibold mb-2">{t('total_products_sold')}</h3> {/* Smaller text */}
          <p className="text-2xl font-bold">
            {total_products_sold !== null ? total_products_sold.toLocaleString() : t('na')}
          </p>
        </div>
        <div className="p-3 bg-green-100 rounded-lg text-center shadow-md"> {/* Reduced padding */}
          <h3 className="text-lg font-semibold mb-2">{t('total_revenue')}</h3> {/* Smaller text */}
          <p className="text-2xl font-bold">
            {total_revenue !== null ? `$${total_revenue.toFixed(2)}` : t('na')}
          </p>
        </div>
      </div>

      {/* Pie Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"> {/* Adjusted grid and margin-top */}
        <div className="p-3 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3 text-center">{t('top_products')}</h2> {/* Smaller heading */}
          {top_products.length > 0 ? (
            <div className="w-full h-48"> {/* Set height */}
              <Pie data={topProductsPieData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm">{t('no_data_available_for_top_products')}</p>
          )}
        </div>
        <div className="p-3 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3 text-center">{t('top_customers')}</h2> {/* Smaller heading */}
          {top_customers.length > 0 ? (
            <div className="w-full h-48"> {/* Set height */}
              <Pie data={topCustomersPieData} options={chartOptions} />
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm">{t('no_data_available_for_top_customers')}</p>
          )}
        </div>
      </div>

      {/* Top Categories Pie Chart */}
      <div className="p-3 bg-white rounded-lg shadow-md mt-4 max-w-xs mx-auto"> {/* Reduced padding and max-width */}
        <h2 className="text-lg font-semibold mb-2 text-center">{t('top_categories')}</h2> {/* Smaller heading */}
        {top_categories.length > 0 ? (
          <div className="w-full h-48"> {/* Set height */}
            <Pie data={topCategoriesPieData} options={chartOptions} />
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm">{t('no_data_available_for_top_categories')}</p>
        )}
      </div>

      {/* Monthly Sales Line Chart */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">{t('monthly_sales')}</h2> {/* Smaller heading */}
        {monthly_sales.length > 0 ? (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="w-full h-64"> {/* Set height */}
              <Line data={monthlySalesData} options={chartOptions} />
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
