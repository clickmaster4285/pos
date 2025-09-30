import { isRejectedWithValue, isFulfilled } from '@reduxjs/toolkit';
import { addToast } from '@/features/toastSlice';

export const toastMiddleware = (store) => (next) => (action) => {
  if (isFulfilled(action)) {
    const { type, meta, payload } = action;
    const toastTypes = {
      'authApi/login/fulfilled': {
        type: 'login',
        name: payload?.data?.user?.name || '',
      },
      'authApi/logout/fulfilled': { type: 'logout' },
      'authApi/registerUser/fulfilled': {
        type: 'login',
        name: payload?.data?.user?.name || '',
      },
      'authApi/confirmAccountDeletion/fulfilled': { type: 'account_deleted' },
      'SocialMediaApi/disconnectAccount/fulfilled': {
        type: 'account_disconnected',
        name: payload?.data?.displayName || payload?.data?.id || '',
      },
      'SocialMediaApi/activateAccount/fulfilled': {
        type: 'account_activated',
        name: payload?.data?.displayName || payload?.data?.id || '',
      },
      'SocialMediaApi/deleteAccount/fulfilled': {
        type: 'account_deleted',
        name: payload?.data?.displayName || payload?.data?.id || '',
      },
      'postApi/createPost/fulfilled': { type: 'post_created' },
      'messengerApi/sendMessage/fulfilled': {
        type: 'success',
        details: 'Message sent successfully',
      },
      'messengerApi/updateMessage/fulfilled': {
        type: 'success',
        details: 'Message updated',
      },
      'messengerApi/deleteMessage/fulfilled': { type: 'post_deleted' },
    };
    const mapping = toastTypes[type];
    if (mapping) {
      store.dispatch(addToast(mapping));
    }
  }

  if (isRejectedWithValue(action)) {
    const errorMessage =
      action.payload?.message ||
      action.payload?.error ||
      'An error occurred. Please try again or contact support.';
    store.dispatch(addToast({ type: 'error', details: errorMessage }));
  }

  return next(action);
};
