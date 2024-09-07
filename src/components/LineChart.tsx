import React from 'react';
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

// Register the scales and components
ChartJS.register(
  CategoryScale,   // To use the 'category' scale for the x-axis
  LinearScale,     // To use the 'linear' scale for the y-axis
  PointElement,    // Points in the line chart
  LineElement,     // Lines between points
  Title,           // Title for the chart
  Tooltip,         // Tooltip functionality
  Legend           // Legend display
);

const LineChart = ({ data }: any) => {
  return <Line data={data} />;
};

export default LineChart;
