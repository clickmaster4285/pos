// ToastNotification.jsx
"use client";

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { useSpring, animated } from '@react-spring/web';

export function ToastNotification({ isVisible, type, name, details, status, onClose, onActionClick, duration = 5000 }) {
  const [visible, setVisible] = useState(isVisible);
  const [progress, setProgress] = useState(100);

  // Progress bar animation
  const progressStyle = useSpring({
    width: visible ? `${progress}%` : '100%',
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

  const messages = {
    login: {
      title: `Welcome back, ${name || 'User'}!`,
      description: `You’re logged in and ready to go.${status ? ` (Status: ${status})` : ''}`,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5" />,
      actions: [{ label: 'View Dashboard', onClick: onActionClick }],
    },
    logout: {
      title: 'Logged out successfully',
      description: `See you next time!${status ? ` (Status: ${status})` : ''}`,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5" />,
      actions: [],
    },
    account_deleted: {
      title: 'Account removed',
      description: `Account ${name || 'unknown'} has been permanently deleted.${status ? ` (Status: ${status})` : ''}`,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: <AlertCircle className="w-5 h-5" />,
      actions: [],
    },
    account_disconnected: {
      title: 'Account disconnected',
      description: `Account ${name || 'unknown'} has been disconnected.${status ? ` (Status: ${status})` : ''}`,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: <AlertCircle className="w-5 h-5" />,
      actions: [],
    },
    account_activated: {
      title: 'Account activated',
      description: `Account ${name || 'unknown'} is now active.${status ? ` (Status: ${status})` : ''}`,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5" />,
      actions: [],
    },
    post_created: {
      title: 'Post created',
      description: `Your post has been successfully created.${status ? ` (Status: ${status})` : ''}`,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5" />,
      actions: [{ label: 'View Posts', onClick: onActionClick }],
    },
    post_updated: {
      title: 'Post updated',
      description: `Your post has been updated.${status ? ` (Status: ${status})` : ''}`,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5" />,
      actions: [],
    },
    post_deleted: {
      title: 'Post deleted',
      description: `Your post has been removed.${status ? ` (Status: ${status})` : ''}`,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: <AlertCircle className="w-5 h-5" />,
      actions: [],
    },
    success: {
      title: 'Success',
      description: details || `Action completed successfully.${status ? ` (Status: ${status})` : ''}`,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: <CheckCircle className="w-5 h-5" />,
      actions: [],
    },
    error: {
      title: 'Error',
      description: details || `Something went wrong. Please try again or contact support.${status ? ` (Status: ${status})` : ''}`,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      icon: <AlertCircle className="w-5 h-5" />,
      actions: [{ label: 'Retry', onClick: onActionClick }],
    },
  };

  const message = messages[type] || messages.error;

  if (!visible) return null;

  return (
    <div className={`flex items-start p-4 rounded-lg shadow-lg ${message.bgColor} ${message.textColor} max-w-sm border border-gray-200`}>
      <div className="mr-3">{message.icon}</div>
      <div className="flex-1">
        <h4 className="font-semibold text-base">{message.title}</h4>
        <p className="text-sm mt-1">{message.description}</p>
        {message.actions.length > 0 && (
          <div className="mt-2 flex gap-2">
            {message.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => action.onClick(action.label)}
                className="text-sm font-medium underline hover:text-blue-600"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        <div className="mt-2 h-1 bg-gray-300 rounded-full overflow-hidden">
          <animated.div style={progressStyle} className={`h-full ${message.bgColor === 'bg-green-100' ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>
      <button onClick={onClose} className="ml-4 text-current hover:text-blue-600">
        <X size={16} />
      </button>
    </div>
  );
}

ToastNotification.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  type: PropTypes.string.isRequired,
  name: PropTypes.string,
  details: PropTypes.string,
  status: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), // Add status prop
  onClose: PropTypes.func.isRequired,
  onActionClick: PropTypes.func,
  duration: PropTypes.number,
};