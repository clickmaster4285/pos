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
  ChevronLeft,
  ChevronRight,
  Sparkles,
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
  Inventory: Package,
  Billing: Boxes,
  Vendors: Briefcase,
  Customers: Users,
  Orders: ShoppingCart,
  Sumeries: FileText,
  Reports: BarChart,
  'Live Store': Store,
  Attendance: ClipboardList,
  'Staff Salaries': CreditCard,
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

function buildStaffLinks(user) {
  const subRoleLower = user?.subRole?.toLowerCase() || '';
  const staffBase = subRoleLower
    ? `/staff/${encodeURIComponent(subRoleLower)}`
    : '/staff';

  // Always visible for staff
  const links = [
    {
      href: `${staffBase}/dashboard`,
      label: 'Dashboard',
      icon: iconMap['Dashboard'],
    },
  ];

  // Map permissions → links

  if (hasPerm(user, 'managePlans')) {
    links.push({
      href: `${staffBase}/plans`,
      label: 'Plans',
      icon: iconMap['Plans'],
    });
  }

  if (hasPerm(user, 'manageVendors')) {
    links.push({
      href: `${staffBase}/vendors`,
      label: 'Vendors',
      icon: iconMap['Vendors'],
    });
  }

  if (hasPerm(user, 'manageInventory')) {
    links.push({
      href: `${staffBase}/inventory`,
      label: 'Inventory',
      icon: iconMap['Inventory'],
    });
  }

  // Billing: show if any billing-related permission is true
  if (
    hasAny(user, ['viewBilling', 'addBilling', 'editBilling', 'deleteBilling'])
  ) {
    links.push({
      href: `${staffBase}/billing`,
      label: 'Billing',
      icon: iconMap['Billing'],
    });
  }

  if (hasPerm(user, 'viewReports')) {
    links.push({
      href: `${staffBase}/reports`,
      label: 'Reports',
      icon: iconMap['Reports'],
    });
  }

  // Staff management (if they can see or manage staff)
  if (
    hasAny(user, ['viewallstaff', 'staffCreate', 'staffUpdate', 'staffDelete'])
  ) {
    links.push({
      href: `${staffBase}/staff`,
      label: 'Staff',
      icon: iconMap['Staff'],
    });
  }

  // Orders (example: show if they can manageAppointments OR assignTasks; tweak as you like)
  if (user?.subRole?.toLowerCase() === 'receptionist') {
    links.push({
      href: `${staffBase}/orders`,
      label: 'Orders',
      icon: iconMap['Orders'],
    });
  }

  // salary : show if any salary-related permission is true
  if (
    hasAny(user, [
      'createPayment',
      'viewAllStaffSalaries',
      'updateSalary',
      'deletePayment',
      'staffSummary',
      'viewActiveLog',
      'viewCompanySummary',
    ])
  ) {
    links.push({
      href: `${staffBase}/staff-salaries`,
      label: 'Payments',
      icon: iconMap['Staff Salaries'],
    });
  }

  // Settings: show if they have *any* permission at all (or make your own rule)
  if (
    hasAny(user, [
      'manageVendors',
      'manageInventory',
      'addBilling',
      'editBilling',
      'deleteBilling',
      'viewReports',
      'viewallstaff',
      'staffCreate',
      'staffUpdate',
      'staffDelete',
      'manageAppointments',
      'assignTasks',
      'approveRequests',
      'manageTeams',
      'managePlans',
    ])
  ) {
    links.push({
      href: `${staffBase}/settings`,
      label: 'Settings',
      icon: iconMap['Settings'],
    });
  }

  return links;
}

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
    return {
      superAdmin: [
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
      ],
      admin: [
        {
          href: '/admin/dashboard',
          label: 'Dashboard',
          icon: iconMap['Dashboard'],
        },
        { href: '/admin/staff', label: 'Staff', icon: iconMap['Staff'] },
        {
          href: '/admin/permissions',
          label: 'Permission',
          icon: iconMap['Permission'],
        },
        {
          href: '/admin/inventory',
          label: 'Inventory',
          icon: iconMap['Inventory'],
        },
        { href: '/admin/billing', label: 'Billing', icon: iconMap['Billing'] },
        { href: '/admin/vendors', label: 'Vendors', icon: iconMap['Vendors'] },
        // { href: '#', label: 'Customers', icon: iconMap['Customers'] },
        // { href: '/admin/orders', label: 'Orders', icon: iconMap['Orders'] },
        // { href: '#', label: 'Sumeries', icon: iconMap['Sumeries'] },
        // { href: '#', label: 'Reports', icon: iconMap['Reports'] },
        // { href: '#', label: 'Live Store', icon: iconMap['Live Store'] },
        {
          href: '/admin/attendance-devices',
          label: 'Attendance Devices Setting',
          icon: iconMap['Attendance'],
        },
        {
          href: '/admin/attendance',
          label: 'Manage Attendance',
          icon: iconMap['Attendance'],
        },

        {
          href: '/admin/staff-salaries',
          label: 'Staff Salaries',
          icon: iconMap['Staff Salaries'],
        },
        {
          href: '/admin/setting',
          label: 'Settings',
          icon: iconMap['Settings'],
        },
      ],
      staff: buildStaffLinks(user),

      user: [
        { href: '#', label: 'Dashboard', icon: iconMap['Dashboard'] },
        { href: '#', label: 'Orders', icon: iconMap['Orders'] },
        { href: '#', label: 'Settings', icon: iconMap['Settings'] },
      ],
      guest: [],
    };
  }, [user?.subRole, user?.role]);
  const mainLinks = useMemo(() => {
    if (loading || !user?.role) return roleBasedLinks.guest;
    return roleBasedLinks[user.role] || roleBasedLinks.guest;
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
          {/* {!collapsed && ( */}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-primary bg-clip-text text-transparent">
              AutoMotive
            </h1>
          </div>
          {/* )} */}
          {/* <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-primary/10 text-sidebar-foreground/70 hover:text-primary transition-all duration-200"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button> */}
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
                              ? 'bg-gradient-to-r from-secondary-foreground/20 to-secondary-foreground/10 text-secondary-foreground border-l-4 border-secondary-foreground shadow-md shadow-secondary-foreground/10'
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
