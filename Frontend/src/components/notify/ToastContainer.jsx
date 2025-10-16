// components/ToastContainer.jsx
"use client";

import { useSelector, useDispatch } from 'react-redux';
import { ToastNotification } from './ToastNotification';
import { removeToast } from '@/features/toastSlice';
import { useTransition, animated } from '@react-spring/web';
import { v4 as uuidv4 } from 'uuid';

export function ToastContainer() {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.toast.toasts);

  const transitions = useTransition(toasts, {
    keys: (toast) => toast.id || uuidv4(),
    from: { opacity: 0, transform: 'translateX(100%)' },
    enter: { opacity: 1, transform: 'translateX(0)' },
    leave: { opacity: 0, transform: 'translateX(100%)' },
    config: { tension: 220, friction: 20 },
  });

  return (
<div className="fixed top-4 right-4 z-[99999] flex flex-col space-y-4 w-96 pointer-events-none">
  {transitions((style, toast) => (
    <animated.div style={style} className="pointer-events-auto">
      <ToastNotification
        key={toast.id}
        isVisible={true}
        type={toast.type}
        title={toast.title}
        description={toast.description}
        status={toast.status}
        bgColor={toast.bgColor}
        textColor={toast.textColor}
        icon={toast.icon}
        actions={toast.actions}
        onClose={() => dispatch(removeToast(toast.id || toasts.indexOf(toast)))}
        duration={toast.duration || 5000}
      />
    </animated.div>
  ))}
</div>
  );
}