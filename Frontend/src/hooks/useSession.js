// hooks/useSession.js
import { useState, useEffect } from 'react';

export const useSession = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAuthState = () => {
      try {
        // Try sessionStorage first
        const authState = sessionStorage.getItem('authUser');
        console.log(":the authState: are : ", authState)
        if (authState) {
          return JSON.parse(authState);
        }
        
        // Fallback to localStorage
        const localAuthState = localStorage.getItem('authUser');
        if (localAuthState) {
          return JSON.parse(localAuthState);
        }
        
        return null;
      } catch (error) {
        console.error('Error reading auth state:', error);
        return null;
      }
    };

    const authState = getAuthState();
    setUser(authState);
    setLoading(false);
  }, []);

  return { user, loading };
};