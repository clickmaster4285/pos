'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
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
  UserSquare2,
  Utensils,
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
  Tables: Utensils,
  Sumeries: FileText,
  Reports: BarChart,
  'Live Store': Store,
  Attendance: ClipboardList,
  'Staff Salaries': CreditCard,
  Couriers: ShoppingCart,
  Warehouse: Truck,
  'Profile Setting': UserSquare2,
};

function SidebarFooter({ userName, userRole }) {
  return (
    <div className="sticky bottom-0 border-t border-sidebar-border/50 bg-sidebar/95 px-4 py-3 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl text-primary flex items-center justify-center">
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
          href="profile-setting"
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

// ---- Permission helpers ----
const hasPerm = (user, key) => Boolean(user?.permissions?.[key]);
const hasAny = (user, keys = []) => keys.some((k) => hasPerm(user, k));

function buildStaffLinks(user) {
  const subRoleLower = user?.subRole?.toLowerCase() || '';
  const staffBase = subRoleLower
    ? `/staff/${encodeURIComponent(subRoleLower)}`
    : '/staff';

  const links = [
    {
      href: `${staffBase}/dashboard`,
      label: 'Dashboard',
      icon: iconMap['Dashboard'],
      alwaysShow: true,
    },
    {
      href: `${staffBase}/profile-setting`,
      label: 'Settings',
      icon: iconMap['Settings'],
      alwaysShow: true,
    },
  ];

  if (
    hasAny(user, [
      'createProduct',
      'updateProduct',
      'deleteProduct',
      'viewProduct',
    ])
  ) {
    links.push({
      href: `${staffBase}/product`,
      label: 'Product',
      icon: iconMap['Product'],
    });
  }

  if (
    hasAny(user, [
      'viewBilling',
      'addBilling',
      'editBilling',
      'deleteBilling',
      'createPayment',
    ])
  ) {
    links.push({
      href: `${staffBase}/billing`,
      label: 'Billing',
      icon: iconMap['Billing'],
    });
  }

  if (hasAny(user, ['createOrder', 'viewOrder', 'updateOrderStatus'])) {
    links.push({
      href: `${staffBase}/orders`,
      label: 'Orders',
      icon: iconMap['Orders'],
    });
  }

  if (hasAny(user, ['managePlans'])) {
    links.push({
      href: `${staffBase}/plans`,
      label: 'Plans',
      icon: iconMap['Plans'],
    });
  }

  if (
    hasAny(user, [
      'createVendors',
      'updateVendors',
      'deleteVendors',
      'viewVendors',
    ])
  ) {
    links.push({
      href: `${staffBase}/vendors`,
      label: 'Vendors',
      icon: iconMap['Vendors'],
    });
  }

  if (hasAny(user, ['manageTables'])) {
    links.push({
      href: `${staffBase}/tables`,
      label: 'Tables',
      icon: iconMap['Tables'],
    });
  }

  if (hasAny(user, ['viewReports'])) {
    links.push({
      href: `${staffBase}/reports`,
      label: 'Reports',
      icon: iconMap['Reports'],
    });
  }

  if (
    hasAny(user, ['viewallstaff', 'staffCreate', 'staffUpdate', 'staffDelete'])
  ) {
    links.push({
      href: `${staffBase}/staff`,
      label: 'Staff',
      icon: iconMap['Staff'],
    });
  }

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

  return links;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const authUser = useSelector((state) => state.auth.user); // Moved
  // useSelector here

  const industry = authUser.industryName;

  const isSettingsMode = pathname?.startsWith('/settings');

  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Get user data from Redux store on component mount
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    }
    setLoading(false);
  }, [authUser]);

  const roleBasedLinks = useMemo(() => {
    const compulsoryAdminLinks = [
      {
        href: '/admin/dashboard',
        label: 'Dashboard',
        icon: iconMap['Dashboard'],
        compulsory: true,
      },
      {
        href: '/admin/product',
        label: 'Product',
        icon: iconMap['Product'],
        compulsory: true,
      },

      {
        href: '/admin/orders',
        label: 'Orders',
        icon: iconMap['Orders'],
        compulsory: true,
      },
      {
        href: '/admin/billing',
        label: 'Billing',
        icon: iconMap['Billing'],
        compulsory: true,
      },
      {
        href: '/admin/profile-setting',
        label: 'Setting',
        icon: iconMap['Profile Setting'],
        compulsory: true,
      },
      {
        href: '/admin/setting',
        label: 'Company Profile',
        icon: iconMap['Settings'],
        compulsory: true,
      },
      {
        href: '/admin/ingredient',
        label: 'ingredient',
        icon: iconMap['Settings'],
        compulsory: true,
      },
    ];

    const optionalAdminLinks = [
      {
        href: '/admin/staff',
        label: 'Staff',
        icon: iconMap['Staff'],
        extraFeature: 'Staff',
      },

      {
        href: '/admin/permissions',
        label: 'Permission',
        icon: iconMap['Permission'],
        extraFeature: 'Permissions',
      },
      {
        href: '/admin/vendors',
        label: 'Vendors',
        icon: iconMap['Vendors'],
        extraFeature: 'Vendors',
      },
      ...(industry?.toLowerCase() === 'restaurant'
        ? [
            {
              href: '/admin/tables',
              label: 'Tables',
              icon: iconMap['Tables'],
              compulsory: true,
            },
          ]
        : []),
      {
        href: '/admin/category',
        label: 'Category',
        icon: iconMap['Product'],
        extraFeature: 'Category',
      },
      {
        href: '#',
        label: 'Warehouse',
        icon: iconMap['Warehouse'],
        extraFeature: 'WareHouse',
      },
      {
        href: '/admin/attendance-devices',
        label: 'Attendance Devices Setting',
        icon: iconMap['Attendance'],
        extraFeature: 'Attendance Device',
      },
      {
        href: '/admin/attendance',
        label: 'Manage Attendance',
        icon: iconMap['Attendance'],
        extraFeature: 'Manage Attendance',
      },
      {
        href: '/admin/staff-salaries',
        label: 'Staff Salaries',
        icon: iconMap['Staff Salaries'],
        extraFeature: 'Staff Salary',
      },
      {
        href: '/admin/couriers',
        label: 'Couriers & Shipment',
        icon: iconMap['Couriers'],
        extraFeature: 'Courier & Shipment',
      },
    ];

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
        {
          href: '/superadmin/profile-setting',
          label: 'Settings',
          icon: iconMap['Settings'],
        },
        {
          href: '/superadmin/payment-gateway-config',
          label: 'Payment GateWay Configuration',
          icon: iconMap['Settings'],
        },
      ],
      admin: [...compulsoryAdminLinks, ...optionalAdminLinks],
      staff: buildStaffLinks(user),
      user: [
        { href: '#', label: 'Dashboard', icon: iconMap['Dashboard'] },
        { href: '#', label: 'Orders', icon: iconMap['Orders'] },
        { href: '#', label: 'Settings', icon: iconMap['Settings'] },
      ],
      guest: [],
    };
  }, [user]);

  const mainLinks = useMemo(() => {
    if (loading || !user?.role) return roleBasedLinks.guest;

    let links = [];
    if (user.role === 'superAdmin') {
      links = roleBasedLinks.superAdmin;
    } else if (roleBasedLinks[user.role]) {
      links = roleBasedLinks[user.role].filter((link) => {
        if (user.role === 'admin' && link.compulsory) {
          return true;
        }

        if (user.role === 'staff' && link.alwaysShow) {
          return true;
        }

        if (user.role === 'admin' && link.extraFeature) {
          return user?.extraFeature?.includes(link.extraFeature);
        }

        if (user.role === 'staff') {
          return true;
        }

        return true;
      });
    }

    return links.length > 0 ? links : roleBasedLinks.guest;
  }, [user, loading, roleBasedLinks]);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-sidebar to-sidebar/95 backdrop-blur-xl shadow-xl border-r border-sidebar-border/30 flex flex-col transition-all duration-300 z-50 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="px-6 py-5 border-b border-sidebar-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-primary bg-clip-text text-transparent">
              {user?.toolName || 'AutoMotive'}
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
                          {collapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                              {label}
                            </div>
                          )}
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
