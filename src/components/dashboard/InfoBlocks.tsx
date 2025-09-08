import React from 'react';

export const InfoCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; darkMode?: boolean }>
  = ({ icon, title, value, darkMode }) => (
  <div className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
    <div className="flex items-center">
      {icon}
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-2xl">{value}</p>
      </div>
    </div>
  </div>
);

export const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string | number }>
  = ({ icon, label, value }) => (
  <div className="flex items-center">
    {icon}
    <p>
      {label}: <span className="text-2xl font-semibold">{value}</span>
    </p>
  </div>
);
