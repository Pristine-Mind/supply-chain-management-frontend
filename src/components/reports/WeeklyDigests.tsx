import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, ArrowRight } from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';

interface WeeklyDigest {
  id: number;
  generated_at: string;
  report_period_start: string;
  report_period_end: string;
  pdf_report_url: string;
  business_health_score: number;
}

const WeeklyDigests: React.FC = () => {
  const [digests, setDigests] = useState<WeeklyDigest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDigests = async () => {
      try {
        const data = await reportsApi.getWeeklyDigests();
        setDigests(data);
      } catch (error) {
        console.error('Error fetching weekly digests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDigests();
  }, []);

  const safeDigests = Array.isArray(digests) ? digests : [];

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Weekly Business Health Digests</h2>
          <p className="text-gray-500">View and download your weekly performance snapshots.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeDigests.map((digest) => (
          <div key={digest?.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-50 rounded-xl">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Health Score</p>
                  <p className={`text-2xl font-bold ${digest?.business_health_score > 70 ? 'text-green-600' : 'text-orange-600'}`}>
                    {digest?.business_health_score}%
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{digest?.report_period_start ? new Date(digest.report_period_start).toLocaleDateString() : 'N/A'} - {digest?.report_period_end ? new Date(digest.report_period_end).toLocaleDateString() : 'N/A'}</span>
                </div>
                <p className="text-xs text-gray-400">Generated on {digest?.generated_at ? new Date(digest.generated_at).toLocaleString() : 'N/A'}</p>
              </div>

              <div className="mt-6 flex gap-3">
                <a
                  href={digest?.pdf_report_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </div>
          </div>
        ))}

        {safeDigests.length === 0 && (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No digests generated yet</h3>
            <p className="text-gray-500">Your first report will be generated next Monday.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyDigests;
