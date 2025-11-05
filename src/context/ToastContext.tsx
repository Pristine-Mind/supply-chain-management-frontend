import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, ShoppingCart } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'cart';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  // Convenience methods
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
  showCartSuccess: (title: string, message?: string, action?: Toast['action']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 3000);
    const newToast: Toast = {
      ...toast,
      id,
      duration,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'success', title, message, duration });
  }, [addToast]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'error', title, message, duration });
  }, [addToast]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'warning', title, message, duration });
  }, [addToast]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'info', title, message, duration });
  }, [addToast]);

  const showCartSuccess = useCallback((title: string, message?: string, action?: Toast['action']) => {
    addToast({ type: 'cart', title, message, action, duration: 4000 });
  }, [addToast]);

  return (
    <ToastContext.Provider 
      value={{
        toasts,
        addToast,
        removeToast,
        clearToasts,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showCartSuccess,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-accent-success-50 border-accent-success-200 text-accent-success-800';
      case 'error':
        return 'bg-accent-error-50 border-accent-error-200 text-accent-error-800';
      case 'warning':
        return 'bg-accent-warning-50 border-accent-warning-200 text-accent-warning-800';
      case 'info':
        return 'bg-accent-info-50 border-accent-info-200 text-accent-info-800';
      case 'cart':
        return 'bg-primary-50 border-primary-200 text-primary-800';
      default:
        return 'bg-neutral-50 border-neutral-200 text-neutral-800';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-accent-success-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-accent-error-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-accent-warning-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-accent-info-600" />;
      case 'cart':
        return <ShoppingCart className="w-5 h-5 text-primary-600" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        border rounded-lg p-4 shadow-elevation-lg
        transform transition-all duration-300 ease-in-out
        animate-in slide-in-from-right-full
      `}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="text-body font-semibold">{toast.title}</h4>
          {toast.message && (
            <p className="text-caption text-current opacity-80 mt-1">{toast.message}</p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-caption font-medium underline hover:no-underline transition-all"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-current opacity-60 hover:opacity-100 transition-opacity p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};