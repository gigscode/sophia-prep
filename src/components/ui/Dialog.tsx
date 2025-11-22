import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Button } from './Button';

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
};

export function Dialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true,
}: DialogProps) {
  if (!isOpen) return null;

  const icons = {
    info: <Info className="w-6 h-6 text-blue-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
    error: <XCircle className="w-6 h-6 text-red-600" />,
    success: <CheckCircle className="w-6 h-6 text-green-600" />,
  };

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">{icons[type]}</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-gray-600 text-sm">{message}</p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6 justify-end">
          {showCancel && (
            <Button variant="ghost" onClick={onClose}>
              {cancelText}
            </Button>
          )}
          <Button variant="primary" onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Dialog;

