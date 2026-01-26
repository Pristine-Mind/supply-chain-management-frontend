import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';

const BackButton: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBack = () => {
    try {
      navigate(-1);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'SecurityError') {
        console.warn('Unable to navigate back: security context restriction');
        // Fallback to home page if back navigation fails
        navigate('/');
      } else {
        throw error;
      }
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 px-3 py-2 text-neutral-600 hover:text-neutral-900 transition-colors rounded-md hover:bg-neutral-100"
    >
      <ChevronLeft className="w-4 h-4" />
      <span className="text-caption font-medium">{t('back')}</span>
    </button>
  );
};

export default BackButton;
