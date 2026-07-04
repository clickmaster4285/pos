// components/ToastNotification.jsx
"use client";

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { useSpring, animated } from '@react-spring/web';

// Map icon identifiers to React components
const iconMap = {
  'check-circle': <CheckCircle size={20} />,
  'alert-circle': <AlertCircle size={20} />,
};

export function ToastNotification({
  isVisible,
  type,
  title,
  description,
  status,
  bgColor,
  textColor,
  icon,
  actions = [],
  onClose,
  duration = 5000,
}) {
  const [visible, setVisible] = useState(isVisible);
  const [progress, setProgress] = useState(100);

  const progressStyle = useSpring({
    width: visible ? `${progress}%` : '0%',
    from: { width: '100%' },
    config: { duration },
  });

  useEffect(() => {
    setVisible(isVisible);
    if (isVisible && duration) {
      const start = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - start;
        const newProgress = Math.max(100 - (elapsed / duration) * 100, 0);
        setProgress(newProgress);
        if (newProgress <= 0) {
          setVisible(false);
          onClose();
        }
      }, 50);
      return () => clearInterval(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!visible) return null;

  const progressColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const renderedIcon = iconMap[icon] || null; // Map string identifier to component

  return (
    <div className={`flex items-start p-4 rounded-lg shadow-lg ${bgColor} ${textColor} max-w-sm border border-gray-200`}>
      {renderedIcon && <div className="mr-3 shrink-0">{renderedIcon}</div>}
      <div className="flex-1">
        <h4 className="font-semibold text-base">{title}</h4>
        <p className="text-sm mt-1">{description}</p>
        {status && (
          <p className="text-xs mt-1 opacity-75">Status: {status}</p>
        )}
        {actions.length > 0 && (
          <div className="mt-2 flex gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => action.onClick?.()}
                className="text-sm font-medium underline hover:text-blue-600"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 h-1 bg-gray-300 rounded-full overflow-hidden">
          <animated.div style={progressStyle} className={`h-full ${progressColor}`} />
        </div>
      </div>
      <button onClick={onClose} className="ml-4 text-current hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  );
}

ToastNotification.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  type: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  bgColor: PropTypes.string,
  textColor: PropTypes.string,
  icon: PropTypes.string, // Changed to string
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      onClick: PropTypes.func,
    })
  ),
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number,
};