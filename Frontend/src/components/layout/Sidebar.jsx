'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useGetCompanyQuery } from '@/features/CompanyApi';
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
  ChevronUp,
  ChevronDown,
  UserSquare2,
  Utensils,
  ListChecks,
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
  Ingredient: ListChecks,
  Inventory: BarChart,
};

function SidebarFooter({ userName, userRole }) {
  return (
    <div className="border-t border-sidebar-border/50 bg-sidebar/95 px-4 py-3 backdrop-blur-lg">
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
  const [hoveredItem, setHoveredItem] = useState(null);

  const { data: companyRes, isLoading, isError } = useGetCompanyQuery();
  const companyName = companyRes?.data?.name || 'Your Company';

  // Groups expanded by default for better UX
  const [openGroups, setOpenGroups] = useState({
    inventory: true,
    staff: true,
    company: true,
  });

  const authUser = useSelector((state) => state.auth.user);
  const industry = authUser?.industryName;

  const isSettingsMode = pathname?.startsWith('/settings');

  const isActive = (href) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const toggleGroup = (key) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

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
      ...(industry?.toLowerCase() === 'restaurant'
        ? [
            {
              href: '/admin/ingredient',
              label: 'Ingredient',
              icon: iconMap['Ingredient'],
              compulsory: true,
            },
          ]
        : []),
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
        href: '/admin/category',
        label: 'Category',
        icon: iconMap['Product'],
        extraFeature: 'Category',
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
  }, [user, industry]);

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

  // --------- GROUPS (UI only) ---------
  const inventoryLabels = [
    'Product',
    'Orders',
    'Billing',
    'Category',
    'Warehouse',
    'Vendors',
    'Couriers & Shipment',
  ];

  const staffManagementLabels = [
    'Staff',
    'Staff Salaries',
    'Permission',
    'Manage Attendance',
    'Attendance Devices Setting',
  ];

  const companyManagementLabels = ['Setting', 'Company Profile'];

  const groupedLabels = new Set([
    ...inventoryLabels,
    ...staffManagementLabels,
    ...companyManagementLabels,
  ]);

  // Top-level (non-grouped) links
  const mainMenuLinks = useMemo(
    () => mainLinks.filter((link) => !groupedLabels.has(link.label)),
    [mainLinks]
  );

  const inventoryMenuItems = useMemo(
    () => mainLinks.filter((link) => inventoryLabels.includes(link.label)),
    [mainLinks]
  );

  const staffMenuItems = useMemo(
    () =>
      mainLinks.filter((link) => staffManagementLabels.includes(link.label)),
    [mainLinks]
  );

  const companyMenuItems = useMemo(
    () =>
      mainLinks.filter((link) => companyManagementLabels.includes(link.label)),
    [mainLinks]
  );

  const renderLink = ({ href, label, icon: Icon, companyName }) => {
    const active = isActive(href);
    return (
      <li key={label}>
        <Link
          href={href}
          className={`group relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
            active
              ? 'bg-gradient-to-r from-primary/90 to-secondary-foreground/90 text-card font-bold border-l-4 border-secondary-foreground shadow-md shadow-secondary-foreground/10'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground border-l-4 border-transparent'
          }`}
          aria-current={active ? 'page' : undefined}
          onMouseEnter={() => setHoveredItem(label)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="relative">
            <Icon
              className={`transition-transform duration-200 ${
                hoveredItem === label ? 'scale-110' : 'scale-100'
              } mr-3 h-5 w-5`}
            />
          </div>
          <span className="transition-all duration-200 truncate">{label}</span>
        </Link>
      </li>
    );
  };

  const renderGroupHeader = (key, title, Icon, isOpen, companyName) => {
    return (
      <li
        key={`${key}-group-header`}
        className="sticky top-0 z-10 bg-sidebar/95 backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={() => toggleGroup(key)}
          className="group flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-sidebar-foreground/90 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-all duration-200 "
        >
          <div className="flex items-center min-w-0">
            <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
            <span className="truncate">{title}</span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 opacity-80 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-80 flex-shrink-0" />
          )}
        </button>
      </li>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-sidebar to-sidebar/95 backdrop-blur-xl shadow-xl border-r border-sidebar-border/30 flex flex-col z-50">
      {/* Header */}
      <div className="px-6 py-5 border-b border-sidebar-border/30 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-primary bg-clip-text text-transparent truncate">
              {/* {user?.toolName || 'AutoMotive'} */}
              {companyName || 'SmartPOS'}
            </h1>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 flex flex-col min-h-0">
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
          <div className="flex-1 flex flex-col min-h-0">
            {!isSettingsMode ? (
              <>
                <nav className="flex-1 overflow-y-auto overflow-x-hidden">
                  <ul className="space-y-1 p-3">
                    {/* Non-grouped items (Dashboard, etc.) */}
                    {mainMenuLinks.map(renderLink)}

                    {/* INVENTORY MANAGEMENT */}
                    {inventoryMenuItems.length > 0 && (
                      <>
                        {renderGroupHeader(
                          'inventory',
                          'Inventory Management',
                          BarChart,
                          openGroups.inventory
                        )}
                        {openGroups.inventory && (
                          <ul className="space-y-1 mt-1 ml-4  pl-2">
                            {inventoryMenuItems.map((link) => renderLink(link))}
                          </ul>
                        )}
                      </>
                    )}

                    {/* STAFF MANAGEMENT */}
                    {staffMenuItems.length > 0 && (
                      <>
                        {renderGroupHeader(
                          'staff',
                          'Staff Management',
                          CreditCard,
                          openGroups.staff
                        )}
                        {openGroups.staff && (
                          <ul className="space-y-1 mt-1 ml-4  pl-2">
                            {staffMenuItems.map((link) => renderLink(link))}
                          </ul>
                        )}
                      </>
                    )}

                    {/* COMPANY MANAGEMENT */}
                    {companyMenuItems.length > 0 && (
                      <>
                        {renderGroupHeader(
                          'company',
                          'Company Management',
                          Building,
                          openGroups.company
                        )}
                        {openGroups.company && (
                          <ul className="space-y-1 mt-1 ml-4 pl-2">
                            {companyMenuItems.map((link) => renderLink(link))}
                          </ul>
                        )}
                      </>
                    )}
                  </ul>
                </nav>

                {/* Footer - positioned at bottom */}
                <div className="shrink-0">
                  <SidebarFooter userName={user?.name} userRole={user?.role} />
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col">
                <div className="px-3 py-4">
                  <button
                    onClick={() =>
                      router.push(mainLinks[0]?.href || '/dashboard')
                    }
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-all duration-200 hover:gap-3"
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
                    <span>Back to Main</span>
                  </button>
                </div>
                <div className="shrink-0 mt-auto">
                  <SidebarFooter userName={user?.name} userRole={user?.role} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
