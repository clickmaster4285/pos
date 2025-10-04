// File: src/app/(admin)/layout.js and src/app/(superadmin)/layout.js
'use client';
import { useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { AuthContext } from '@/components/auth/SecureAuthProvider';

export default function Layout({ children }) {
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useContext(AuthContext);

  // Determine allowed role based on route group
  const allowedRole = pathname.startsWith(`/staff`) ? 'staff' : null;

  // Check role and handle unauthorized access
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      user?.role?.toLowerCase() !== allowedRole
    ) {
      console.error(
        `[Layout] Unauthorized access to ${pathname} by role ${user?.role}`
      );
      logout('Unauthorized access');
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, pathname, logout, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || user?.role?.toLowerCase() !== allowedRole) {
    return null; // Render nothing while redirecting
  }

  return (
    <div className="h-screen w-screen flex">
      <div className="w-64 bg-gray-100 border-r fixed left-0 top-0 h-full z-20">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col ml-64">
        <div className="h-auto border-b fixed top-0 left-64 right-0 z-10">
          <Navbar setErrorMessage={setErrorMessage} />
        </div>
        <div className="flex-1 overflow-auto mt-14 p-2 bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}
