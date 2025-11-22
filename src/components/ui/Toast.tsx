import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastProps = {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
};

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <XCircle className="w-5 h-5 text-red-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ${
        bgColors[type]
      } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
    >
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
        aria-label="Close toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast Container Component
type ToastMessage = {
  id: string;
  message: string;
  type: ToastType;
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Expose addToast function globally
  useEffect(() => {
    (window as any).addToast = (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Helper function to show toasts
export const showToast = (message: string, type: ToastType = 'info') => {
  if ((window as any).addToast) {
    (window as any).addToast(message, type);
  }
};

export default Toast;

