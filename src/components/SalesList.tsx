import React, { useEffect, useState } from 'react';
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

const categoryOptions: Category[] = [
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

  const fetchStats = () => {
    setLoading(true);
    setNoData(false);

    const params: any = {};

    if (location) params.location = location;
    if (category) params.category = category;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    axios
      .get<StatsResponse>(`${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/stats/`, { params })
      .then((response) => {
        const { total_products_sold, total_revenue, top_customers, top_products, top_categories, monthly_sales } = response.data;

        if (
          !total_products_sold &&
          !total_revenue &&
          top_customers.length === 0 &&
          top_products.length === 0 &&
          top_categories.length === 0 &&
          monthly_sales.length === 0
        ) {
          setNoData(true);
        } else {
          setStats(response.data);
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error(t('error_fetching_stats'), error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApplyFilters = () => {
    fetchStats();
  };

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  if (noData || !stats) {
    return <div className="text-center py-8">{t('no_data_available')}</div>;
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

  const topProductsPieData = {
    labels: top_products.map((product) => product.order__product__name),
    datasets: [
      {
        data: top_products.map((product) => product.total_sold),
        backgroundColor: ['#FFA07A', '#FFD700', '#87CEEB', '#98FB98', '#B0C4DE'],
      },
    ],
  };

  const topCategoriesPieData = {
    labels: top_categories.map((category) => category.order__product__category),
    datasets: [
      {
        data: top_categories.map((category) => category.total_sold),
        backgroundColor: ['#FFA07A', '#FFD700', '#87CEEB', '#98FB98', '#B0C4DE'],
      },
    ],
  };

  const topCustomersPieData = {
    labels: top_customers.map((customer) => customer.order__customer__name),
    datasets: [
      {
        data: top_customers.map((customer) => customer.total_spent),
        backgroundColor: ['#FFA07A', '#FFD700', '#87CEEB', '#98FB98', '#B0C4DE'],
      },
    ],
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">{t('sales_statistics_dashboard')}</h1>

      <div className="p-4 mb-6 bg-gray-100 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">{t('filters')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block font-bold mb-1">{t('location')}</label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('enter_location')}
            />
          </div>
          <div>
            <label className="block font-bold mb-1">{t('category')}</label>
            <select
              className="w-full p-2 border rounded-lg"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{t('all_categories')}</option>
              {categoryOptions.map((categoryOption) => (
                <option key={categoryOption.value} value={categoryOption.value}>
                  {categoryOption.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1">{t('start_date')}</label>
            <input
              type="date"
              className="w-full p-2 border rounded-lg"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-bold mb-1">{t('end_date')}</label>
            <input
              type="date"
              className="w-full p-2 border rounded-lg"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
          >
            {t('apply_filters')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <div className="p-4 bg-blue-100 rounded-lg text-center shadow-md">
          <h3 className="text-xl font-bold">{t('total_products_sold')}</h3>
          <p className="text-3xl font-bold">
            {total_products_sold !== null ? total_products_sold.toLocaleString() : t('na')}
          </p>
        </div>
        <div className="p-4 bg-green-100 rounded-lg text-center shadow-md">
          <h3 className="text-xl font-bold">{t('total_revenue')}</h3>
          <p className="text-3xl font-bold">
            {total_revenue !== null ? `$${total_revenue.toFixed(2)}` : t('na')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-center">{t('top_products')}</h2>
          {top_products.length > 0 ? (
            <Pie data={topProductsPieData} />
          ) : (
            <p className="text-center text-gray-500">{t('no_data_available_for_top_products')}</p>
          )}
        </div>
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-center">{t('top_customers')}</h2>
          {top_customers.length > 0 ? (
            <Pie data={topCustomersPieData} />
          ) : (
            <p className="text-center text-gray-500">{t('no_data_available_for_top_customers')}</p>
          )}
        </div>
      </div>

      <div className="p-2 bg-white rounded-lg shadow-md mt-8 max-w-sm mx-auto">
        <h2 className="text-xl font-bold mb-2 text-center">{t('top_categories')}</h2>
        {top_categories.length > 0 ? (
          <div className="w-100">
            <Pie data={topCategoriesPieData} options={{ maintainAspectRatio: true }} />
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm">{t('no_data_available_for_top_categories')}</p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">{t('monthly_sales')}</h2>
        {monthly_sales.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Line data={monthlySalesData} />
          </div>
        ) : (
          <p className="text-center text-gray-500">{t('no_data_available_for_monthly_sales')}</p>
        )}
      </div>
    </div>
  );
};

export default StatsDashboard;

