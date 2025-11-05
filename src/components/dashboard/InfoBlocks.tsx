import React from 'react';

export const InfoCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; darkMode?: boolean }>
  = ({ icon, title, value, darkMode }) => (
  <div className={`p-6 rounded-lg shadow-elevation-md border transition-shadow hover:shadow-elevation-lg ${
    darkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
  }`}>
    <div className="flex items-center gap-4">
      {icon}
      <div>
        <h2 className={`text-h3 font-semibold ${darkMode ? 'text-neutral-100' : 'text-neutral-900'}`}>{title}</h2>
        <p className={`text-h2 font-bold ${darkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>{value}</p>
      </div>
    </div>
  </div>
);

export const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string | number }>
  = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors">
    {icon}
    <p className="text-body text-neutral-700">
      {label}: <span className="text-h3 font-semibold text-neutral-900">{value}</span>
    </p>
  </div>
);
