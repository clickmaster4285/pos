"use client";

import { useSelector, useDispatch } from 'react-redux';
import { ToastNotification } from './ToastNotification';
import { removeToast } from '@/features/toastSlice';
import { useTransition, animated } from '@react-spring/web';

export function ToastContainer() {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.toast.toasts);

  // Add transitions for smooth entry/exit
  const transitions = useTransition(toasts, {
    keys: (toast, index) => index,
    from: { opacity: 0, transform: 'translateX(100%)' },
    enter: { opacity: 1, transform: 'translateX(0)' },
    leave: { opacity: 0, transform: 'translateX(100%)' },
    config: { tension: 220, friction: 20 },
  });

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-4 w-96">
      {transitions((style, toast, _, index) => (
        <animated.div style={style}>
          <ToastNotification
            key={index}
            isVisible={true}
            type={toast.type}
            name={toast.name}
            details={toast.details}
            onClose={() => dispatch(removeToast(index))}
            onActionClick={(label) => console.log(`Action clicked: ${label}`)}
            duration={toast.duration || 5000}
          />
        </animated.div>
      ))}
    </div>
  );
}