import React from 'react';
import { AlertCircle, CheckCircle, Info, Loader } from 'lucide-react';

export interface AuthErrorDisplayProps {
  error: string | null;
  type?: 'error' | 'warning' | 'info' | 'success';
  fieldErrors?: Record<string, string[]>;
  onDismiss?: () => void;
  showDetails?: boolean;
}

/**
 * Reusable error display component for authentication forms
 */
export const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({
  error,
  type = 'error',
  fieldErrors = {},
  onDismiss,
  showDetails = false,
}) => {
  if (!error) return null;

  const bgColors = {
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
  };

  const iconColors = {
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
    success: 'text-green-600',
  };

  const textColors = {
    error: 'text-red-700',
    warning: 'text-yellow-700',
    info: 'text-blue-700',
    success: 'text-green-700',
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className={`h-5 w-5 ${iconColors.error}`} />;
      case 'warning':
        return <AlertCircle className={`h-5 w-5 ${iconColors.warning}`} />;
      case 'info':
        return <Info className={`h-5 w-5 ${iconColors.info}`} />;
      case 'success':
        return <CheckCircle className={`h-5 w-5 ${iconColors.success}`} />;
      default:
        return null;
    }
  };

  const fieldErrorCount = Object.keys(fieldErrors).length;

  return (
    <div className={`border rounded-lg p-4 mb-6 ${bgColors[type]}`}>
      <div className="flex gap-3">
        {getIcon()}
        <div className="flex-1">
          <p className={`font-medium ${textColors[type]}`}>{error}</p>
          
          {showDetails && fieldErrorCount > 0 && (
            <div className="mt-3 space-y-2">
              <p className={`text-sm font-medium ${textColors[type]}`}>Issues found:</p>
              <ul className="space-y-1">
                {Object.entries(fieldErrors).map(([field, messages]) => (
                  <li key={field} className={`text-sm ${textColors[type]}`}>
                    <strong className="capitalize">{field}:</strong>
                    {' '}
                    {Array.isArray(messages) ? messages.join(', ') : messages}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`text-sm font-medium ${textColors[type]} hover:opacity-75 transition-opacity`}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Loading error display component
 */
export const LoadingError: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
    <Loader className="h-5 w-5 text-gray-400 animate-spin" />
    <p className="text-sm text-gray-600">{message}</p>
  </div>
);

/**
 * Field-level error message component
 */
export interface FieldErrorProps {
  error?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ error }) => {
  if (!error) return null;
  return (
    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
      <AlertCircle className="h-4 w-4" />
      {error}
    </p>
  );
};

export default { AuthErrorDisplay, LoadingError, FieldError };
