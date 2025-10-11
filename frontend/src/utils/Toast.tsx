import React, { useEffect, useState } from 'react';
import { applyBgColor, applyColor } from '@/utils/color';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { 
          ...applyBgColor('teal'),
          ...applyColor('white')
        };
      case 'error':
        return { 
          ...applyBgColor('orange'),
          ...applyColor('white')
        };
      case 'warning':
        return { 
          ...applyBgColor('gold'),
          ...applyColor('darkNavy')
        };
      case 'info':
      default:
        return { 
          ...applyBgColor('blue'),
          ...applyColor('white')
        };
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 transform ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={getToastStyles(toast.type)}
    >
      <div className="flex items-center">
        <span className="mr-2">{toast.message}</span>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => onRemove(toast.id), 300);
          }}
          style={applyColor('white')}
          className="ml-2 font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Toast container component
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (event: CustomEvent<Omit<Toast, 'id'>>) => {
      const { detail } = event;
      const newToast: Toast = {
        id: Math.random().toString(36).substr(2, 9),
        message: detail.message,
        type: detail.type || 'info',
        duration: detail.duration || 5000,
      };
      
      setToasts(prev => [...prev, newToast]);
    };

    window.addEventListener('show-toast', handleToast as EventListener);
    
    return () => {
      window.removeEventListener('show-toast', handleToast as EventListener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

// Helper function to show toasts
export const toast = {
  success: (message: string, duration?: number) => {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { type: 'success', message, duration }
    }));
  },
  error: (message: string, duration?: number) => {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { type: 'error', message, duration }
    }));
  },
  info: (message: string, duration?: number) => {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { type: 'info', message, duration }
    }));
  },
  warning: (message: string, duration?: number) => {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { type: 'warning', message, duration }
    }));
  },
};

export default ToastComponent;