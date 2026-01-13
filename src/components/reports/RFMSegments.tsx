import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Filter, Search } from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';

interface RFMSegment {
  id: number;
  customer_name: string;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  overall_score: number;
  segment_name: string;
}

const RFMSegments: React.FC = () => {
  const [segments, setSegments] = useState<RFMSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const data = await reportsApi.getRFMSegments();
        setSegments(data);
      } catch (error) {
        console.error('Error fetching RFM segments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSegments();
  }, []);

  const filteredSegments = Array.isArray(segments) ? segments.filter(s =>
    (s?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (s?.segment_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  ) : [];

  const getSegmentColor = (name: string) => {
    switch (name?.toLowerCase() || '') {
      case 'champions': return 'bg-green-100 text-green-800';
      case 'loyal customers': return 'bg-blue-100 text-blue-800';
      case 'at risk': return 'bg-red-100 text-red-800';
      case 'hibernating': return 'bg-gray-100 text-gray-800';
      case 'about to sleep': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Intelligence (RFM Analysis)</h2>
          <p className="text-gray-500">Smart scoring based on Recency, Frequency, and Monetary value.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers or segments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Recency</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Frequency</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Monetary</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Total Score</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Segment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSegments.map((segment) => (
                <tr key={segment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{segment.customer_name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                      {segment.recency_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                      {segment.frequency_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                      {segment.monetary_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-orange-600">{segment.overall_score.toFixed(1)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSegmentColor(segment.segment_name)}`}>
                      {segment.segment_name}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RFMSegments;
