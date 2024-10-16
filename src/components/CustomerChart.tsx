import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CustomerChartProps {
  salesData: { name: string; sales: number }[];
}

const CustomerChart: React.FC<CustomerChartProps> = ({ salesData }) => {
  const { t } = useTranslation();

  const chartData = {
    labels: salesData.map((customer) => customer.name),
    datasets: [
      {
        label: t('sales'),
        data: salesData.map((customer) => customer.sales),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-2">{t('top_customers_by_sales')}</h3>
      <Bar data={chartData} />
    </div>
  );
};

export default CustomerChart;
