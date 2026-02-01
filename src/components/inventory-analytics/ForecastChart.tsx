import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Button } from '../ui/button';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ForecastMethod } from '../../types/inventoryAnalytics';
import { getForecastMethodDisplay, getForecastMethodDescription } from '../../api/inventoryAnalyticsApi';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

export interface ForecastChartProps {
  productId: number;
  productName: string;
  dailyForecast: number;
  confidenceInterval: [number, number];
  forecastPeriodDays: number;
  method: ForecastMethod;
  stdDeviation: number;
  individualForecasts?: Array<{
    daily_forecast: number;
    method: string;
  }>;
  onMethodChange?: (method: ForecastMethod, days: number) => void;
  loading?: boolean;
}

const ForecastChart: React.FC<ForecastChartProps> = ({
  productName,
  dailyForecast,
  confidenceInterval,
  forecastPeriodDays,
  method,
  stdDeviation,
  individualForecasts = [],
  onMethodChange,
  loading = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<ForecastMethod>(method);
  const [selectedDays, setSelectedDays] = useState<number>(forecastPeriodDays);

  const methods: ForecastMethod[] = ['ensemble', 'moving_average', 'exponential_smoothing', 'seasonal'];
  const daysOptions = [7, 14, 30, 60, 90];

  const handleUpdate = () => {
    if (onMethodChange) {
      onMethodChange(selectedMethod, selectedDays);
    }
  };

  // Generate forecast data points
  const generateForecastData = () => {
    const labels: string[] = [];
    const mainForecast: number[] = [];
    const upperBound: number[] = [];
    const lowerBound: number[] = [];

    const today = new Date();
    
    for (let i = 0; i < selectedDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Add some realistic variation to the forecast
      const variation = Math.sin(i * 0.5) * stdDeviation * 0.5;
      mainForecast.push(Math.max(0, dailyForecast + variation));
      upperBound.push(Math.max(0, confidenceInterval[1] + variation));
      lowerBound.push(Math.max(0, confidenceInterval[0] + variation));
    }

    return { labels, mainForecast, upperBound, lowerBound };
  };

  const { labels, mainForecast, upperBound, lowerBound } = generateForecastData();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Upper Bound (95% CI)',
        data: upperBound,
        borderColor: 'rgba(99, 102, 241, 0.3)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderDash: [5, 5],
        fill: '+1',
        pointRadius: 0,
        tension: 0.4,
      },
      {
        label: 'Forecast',
        data: mainForecast,
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: '-1',
        pointRadius: 3,
        pointBackgroundColor: 'rgb(79, 70, 229)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'Lower Bound (95% CI)',
        data: lowerBound,
        borderColor: 'rgba(99, 102, 241, 0.3)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderDash: [5, 5],
        fill: '-1',
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} units`;
          },
        },
      },
      title: {
        display: true,
        text: `${productName} - ${selectedDays}-Day Demand Forecast`,
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Predicted Daily Demand (units)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Demand Forecast</h3>
          <p className="text-sm text-gray-500 mt-1">
            {getForecastMethodDescription(selectedMethod)}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value as ForecastMethod)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {methods.map((m) => (
              <option key={m} value={m}>
                {getForecastMethodDisplay(m)}
              </option>
            ))}
          </select>

          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {daysOptions.map((d) => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>

          <Button
            size="sm"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Update'}
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-indigo-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600 uppercase tracking-wide">Daily Avg</p>
          <p className="text-2xl font-bold text-indigo-600">{dailyForecast.toFixed(1)}</p>
          <p className="text-xs text-gray-500">units/day</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600 uppercase tracking-wide">Total Forecast</p>
          <p className="text-2xl font-bold text-green-600">
            {(dailyForecast * selectedDays).toFixed(0)}
          </p>
          <p className="text-xs text-gray-500">units</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600 uppercase tracking-wide">Confidence Range</p>
          <p className="text-lg font-bold text-blue-600">
            {confidenceInterval[0].toFixed(1)} - {confidenceInterval[1].toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">95% CI</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-600 uppercase tracking-wide">Std Deviation</p>
          <p className="text-2xl font-bold text-purple-600">{stdDeviation.toFixed(1)}</p>
          <p className="text-xs text-gray-500">units</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Individual Method Forecasts */}
      {individualForecasts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Individual Method Forecasts</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {individualForecasts.map((forecast, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  forecast.method === selectedMethod
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <p className="text-xs text-gray-500 capitalize">{forecast.method.replace(/_/g, ' ')}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {forecast.daily_forecast.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">units/day</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastChart;
