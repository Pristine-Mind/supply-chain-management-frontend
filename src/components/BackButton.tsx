import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const BackButton: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center px-4 py-2 text-lg font-semibold text-white transition-all duration-300 transform bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
    >
      <FaArrowLeft className="mr-3 text-white" /> {t('back')}
    </button>
  );
};

export default BackButton;
