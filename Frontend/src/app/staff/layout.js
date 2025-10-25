'use client';
import { useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { AuthContext } from '@/components/auth/SecureAuthProvider';
import PaymentGateway from '@/components/PaymentGateWay/PaymentGateway';
import { useGetCompanyQuery } from '@/features/CompanyApi';

export default function Layout({ children }) {
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useContext(AuthContext);
  const { data: mycompany, isLoading: companyLoading } = useGetCompanyQuery();

  // Determine allowed role based on route group
  const allowedRole = pathname.startsWith('/staff') ? 'staff' : null;

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

  // Authorization logic
  useEffect(() => {
    if (!mycompany || !user) return;

    const activePlan = mycompany?.data?.plan?.find(plan => plan?.isActive === true);
    let authorized = false;

    const userSub = mycompany?.data?.subscription.find(
      s =>
        s.planId === activePlan?.planId &&
        s.companyId === user.companyId &&
        s.status?.toLowerCase() === 'complete'
    );

    if (activePlan?.isActive === true) {
      if (activePlan.price === 0) {
        authorized = true;
      } else if (userSub && activePlan.status === 'in progress') {
        authorized = true;
      }
    }

    setIsAuthorized(authorized);
  }, [mycompany, user]);

  if (isLoading || companyLoading) return <div>Loading...</div>;
  if (!isAuthenticated || user?.role?.toLowerCase() !== allowedRole) return null;

  // Show PaymentGateway if not authorized
  if (!isAuthorized) {
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
            <PaymentGateway />
          </div>
        </div>
      </div>
    );
  }

  // Authorized — show children
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