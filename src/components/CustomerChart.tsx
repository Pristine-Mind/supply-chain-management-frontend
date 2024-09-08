import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CustomerChartProps {
  salesData: { name: string; sales: number }[];
}

const CustomerChart: React.FC<CustomerChartProps> = ({ salesData }) => {
  const chartData = {
    labels: salesData.map((customer) => customer.name),
    datasets: [
      {
        label: 'Sales',
        data: salesData.map((customer) => customer.sales),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-2">Top Customers by Sales</h3>
      <Bar data={chartData} />
    </div>
  );
};

export default CustomerChart;
