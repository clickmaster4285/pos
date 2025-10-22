'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  LayoutDashboard,
  Settings,
  User,
  Package,
  ClipboardList,
  Store,
  Boxes,
  CreditCard,
  Building,
  FileText,
  ShoppingCart,
  Users,
  BarChart,
  Briefcase,
  Truck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const iconMap = {
  Dashboard: LayoutDashboard,
  Plans: FileText,
  Companies: Building,
  Users: User,
  'Payment / Billing': CreditCard,
  Settings: Settings,
  Staff: ClipboardList,
  Permission: Store,
  Product: Package,
  Billing: Boxes,
  Vendors: Briefcase,
  Customers: Users,
  Orders: ShoppingCart,
  Sumeries: FileText,
  Reports: BarChart,
  'Live Store': Store,
  Attendance: ClipboardList,
  'Staff Salaries': CreditCard,
  Couriers: ShoppingCart,
  Warehouse: Truck,
};

function SidebarFooter({ userName, userRole }) {
  return (
    <div className="sticky bottom-0 border-t border-sidebar-border/50 bg-sidebar/95 px-4 py-3 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl text-primary flex items-center justify-center ">
          <User className="h-5 w-5 text-secoundry" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            {userName || 'Guest'}
          </p>
          <p className="truncate text-xs text-sidebar-accent-foreground/80 capitalize">
            {userRole || 'unauthenticated'}
          </p>
        </div>
        <Link
          href="/settings/profile"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-sidebar-accent-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-200"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// Function to get auth state from session storage
const getAuthState = () => {
  if (typeof window === 'undefined') return null;

  try {
    const authState = sessionStorage.getItem('authUser');
    if (authState) {
      return JSON.parse(authState);
    }

    // Alternative: check localStorage if sessionStorage doesn't have it
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

// ---- Permission helpers ----
const hasPerm = (user, key) => Boolean(user?.permissions?.[key]);
const hasAny = (user, keys = []) => keys.some((k) => hasPerm(user, k));

// ---- Feature to Link Mapping ----
const featureLinkMap = {
  'Staff': {
    href: '/admin/staff',
    label: 'Staff',
    icon: iconMap['Staff'],
    permissions: ['viewallstaff', 'staffCreate', 'staffUpdate', 'staffDelete']
  },
  'Staff Salary': {
    href: '/admin/staff-salaries',
    label: 'Staff Salaries',
    icon: iconMap['Staff Salaries'],
    permissions: ['createPayment', 'viewAllStaffSalaries', 'updateSalary', 'deletePayment', 'staffSummary', 'viewActiveLog', 'viewCompanySummary']
  },
  'Vendors': {
    href: '/admin/vendors',
    label: 'Vendors',
    icon: iconMap['Vendors'],
    permissions: ['createVendors', 'updateVendors', 'deleteVendors', 'viewVendors']
  },
  'Attendance': {
    href: '/admin/attendance',
    label: 'Manage Attendance',
    icon: iconMap['Attendance'],
    permissions: ['manageAppointments']
  },
  'Attendance Devices': {
    href: '/admin/attendance-devices',
    label: 'Attendance Devices Setting',
    icon: iconMap['Attendance'],
    permissions: ['manageAppointments']
  },
  'Couriers': {
    href: '/admin/couriers',
    label: 'Couriers & Shipment',
    icon: iconMap['Couriers'],
    permissions: ['assignTasks']
  },
  'Reports': {
    href: '/admin/reports',
    label: 'Reports',
    icon: iconMap['Reports'],
    permissions: ['viewReports']
  },
  'Warehouse': {
    href: '/admin/warehouse',
    label: 'Warehouse',
    icon: iconMap['Warehouse'],
    permissions: ['manageTeams']
  },
  'Permissions': {
    href: '/admin/permissions',
    label: 'Permission',
    icon: iconMap['Permission'],
    permissions: ['viewallstaff', 'staffCreate', 'staffUpdate', 'staffDelete']
  },
  'Category': {
    href: '/admin/category',
    label: 'Category',
    icon: iconMap['Product'],
    permissions: ['createProduct', 'updateProduct', 'deleteProduct', 'viewProduct']
  }
};

// ---- Core links that are always available for admin/staff ----
const getCoreLinks = (user) => {
  const coreLinks = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: iconMap['Dashboard'],
      alwaysShow: true
    },
    {
      href: '/admin/product',
      label: 'Product',
      icon: iconMap['Product'],
      alwaysShow: true,
      permissions: ['createProduct', 'updateProduct', 'deleteProduct', 'viewProduct']
    },
    {
      href: '/admin/billing',
      label: 'Billing',
      icon: iconMap['Billing'],
      alwaysShow: true,
      permissions: ['viewBilling', 'addBilling', 'editBilling', 'deleteBilling']
    }
  ];

  // Filter core links based on permissions
  return coreLinks.filter(link => 
    link.alwaysShow || (link.permissions && hasAny(user, link.permissions))
  );
};

// ---- Build dynamic links based ONLY on extraFeatures ----
const buildDynamicLinks = (user) => {
  if (!user?.extraFeature || !Array.isArray(user.extraFeature)) return [];

  const dynamicLinks = [];

  user.extraFeature.forEach(feature => {
    const linkConfig = featureLinkMap[feature];
    if (linkConfig) {
      // Check if user has required permissions for this feature
      if (!linkConfig.permissions || hasAny(user, linkConfig.permissions)) {
        dynamicLinks.push({
          href: linkConfig.href,
          label: linkConfig.label,
          icon: linkConfig.icon
        });
      }
    }
  });

  return dynamicLinks;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const isSettingsMode = pathname?.startsWith('/settings');

  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Get user data from session storage on component mount
  useEffect(() => {
    const authState = getAuthState();
    if (authState) {
      setUser(authState);
    }
    setLoading(false);
  }, []);

  const roleBasedLinks = useMemo(() => {
    // SuperAdmin - fixed links
    if (user?.role === 'superAdmin') {
      return [
        {
          href: '/superadmin/dashboard',
          label: 'Dashboard',
          icon: iconMap['Dashboard'],
        },
        { href: '/superadmin/plan', label: 'Plans', icon: iconMap['Plans'] },
        {
          href: '/superadmin/company',
          label: 'Companies',
          icon: iconMap['Companies'],
        },
        { href: '#', label: 'Users', icon: iconMap['Users'] },
        {
          href: '#',
          label: 'Payment / Billing',
          icon: iconMap['Payment / Billing'],
        },
        { href: '#', label: 'Settings', icon: iconMap['Settings'] },
        { 
          href: '/superadmin/payment-gateway-config', 
          label: 'Payment GateWay Configuration', 
          icon: iconMap['Settings'] 
        },
      ];
    }

    // Admin/Staff - dynamic links
    if (user?.role === 'admin' || user?.role === 'staff') {
      const coreLinks = getCoreLinks(user);
      const dynamicLinks = buildDynamicLinks(user);

      // Combine only Core + ExtraFeature links (NO permission-based links)
      const allLinks = [...coreLinks, ...dynamicLinks];

      // Add Settings link if user has any significant permissions
      if (hasAny(user, [
        'manageVendors', 'createVendors', 'updateVendors', 'deleteVendors', 'viewVendors',
        'manageProduct', 'createProduct', 'updateProduct', 'deleteProduct', 'viewProduct',
        'addBilling', 'editBilling', 'deleteBilling', 'viewBilling',
        'viewReports', 'viewallstaff', 'staffCreate', 'staffUpdate', 'staffDelete',
        'manageAppointments', 'assignTasks', 'approveRequests', 'manageTeams', 'managePlans'
      ])) {
        allLinks.push({
          href: user.role === 'admin' ? '/admin/setting' : `/staff/${encodeURIComponent(user?.subRole?.toLowerCase() || '')}/settings`,
          label: 'Settings',
          icon: iconMap['Settings'],
        });
      }

      return allLinks;
    }

    // User role
    if (user?.role === 'user') {
      return [
        { href: '#', label: 'Dashboard', icon: iconMap['Dashboard'] },
        { href: '#', label: 'Orders', icon: iconMap['Orders'] },
        { href: '#', label: 'Settings', icon: iconMap['Settings'] },
      ];
    }

    // Guest - no links
    return [];
  }, [user]);

  const mainLinks = useMemo(() => {
    if (loading || !user?.role) return [];
    return roleBasedLinks;
  }, [user, loading, roleBasedLinks]);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-sidebar to-sidebar/95 backdrop-blur-xl shadow-xl border-r border-sidebar-border/30 flex flex-col transition-all duration-300 z-50 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-sidebar-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-primary bg-clip-text text-transparent">
              AutoMotive
            </h1>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <p className="text-sidebar-accent-foreground/70 text-sm">
              Loading...
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          {!isSettingsMode ? (
            <>
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                  {mainLinks.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <li key={label}>
                        <Link
                          href={href}
                          className={`group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-gradient-to-r from-secondary-foreground to-secondary-foreground text-primary font-bold border-l-4 border-secondary-foreground shadow-md shadow-secondary-foreground/10'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground border-l-4 border-transparent'
                          } ${collapsed ? 'justify-center' : ''}`}
                          aria-current={active ? 'page' : undefined}
                          onMouseEnter={() => setHoveredItem(label)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <div className="relative">
                            <Icon
                              className={`transition-transform duration-200 ${
                                hoveredItem === label
                                  ? 'scale-110'
                                  : 'scale-100'
                              } ${collapsed ? 'mr-0' : 'mr-3'} h-5 w-5`}
                            />
                          </div>
                          {!collapsed && (
                            <span className="transition-all duration-200">
                              {label}
                            </span>
                          )}

                          {/* Tooltip for collapsed state */}
                          {collapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                              {label}
                            </div>
                          )}

                          {/* Active indicator dot for collapsed state */}
                          {collapsed && active && (
                            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-secondary-foreground rounded-full"></div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <SidebarFooter userName={user?.name} userRole={user?.role} />
            </>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="px-3 py-4">
                <button
                  onClick={() =>
                    router.push(mainLinks[0]?.href || '/dashboard')
                  }
                  className={`flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-all duration-200 hover:gap-3 ${
                    collapsed ? 'justify-center' : ''
                  }`}
                  aria-label="Back to Main"
                  title="Back to Main"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  {!collapsed && <span>Back to Main</span>}
                </button>
              </div>
              <SidebarFooter userName={user?.name} userRole={user?.role} />
            </div>
          )}
        </div>
      )}
    </aside>
  );
}