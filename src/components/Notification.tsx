import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  isOpen,
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-amber-500" />
  };

  const ringColors = {
    success: 'border-emerald-100 bg-emerald-50/90 text-emerald-900',
    error: 'border-rose-100 bg-rose-50/90 text-rose-900',
    info: 'border-amber-100 bg-amber-50/90 text-amber-900'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm"
        >
          <div className={`flex items-start gap-3 p-3.5 rounded-2xl border backdrop-blur-md shadow-lg ${ringColors[type]}`}>
            <span className="flex-shrink-0 mt-0.5">{icons[type]}</span>
            <div className="flex-1 text-sm font-medium pr-5 leading-relaxed">
              {message}
            </div>
            <button
              onClick={onClose}
              className="absolute right-2 top-2.5 p-1 rounded-full text-current/60 hover:text-current hover:bg-current/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
