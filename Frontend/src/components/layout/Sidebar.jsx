'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
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

// ============== CONSTANTS & CONFIGURATION ==============
const ICON_MAP = {
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
  'Live Store': Store,
  Attendance: ClipboardList,
  'Staff Salaries': CreditCard,
  Couriers: ShoppingCart,
  Warehouse: Truck,
  'Profile Setting': UserSquare2,
  Ingredient: ListChecks,
  Inventory: BarChart,
};

const USER_ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  STAFF: 'staff',
  USER: 'user',
  GUEST: 'guest',
};

const INDUSTRIES = {
  RESTAURANT: 'Restaurant',
  RETAIL: 'Retail',
};

const NAVIGATION_GROUPS = {
  INVENTORY: 'inventory',
  STAFF: 'staff',
  COMPANY: 'company',
  RESTAURANT: 'restaurant',
};

const GROUP_CONFIGS = {
  [NAVIGATION_GROUPS.INVENTORY]: {
    title: 'Inventory Management',
    icon: BarChart,
    labels: ['Product', 'Orders', 'Billing', 'Category', 'Vendors', 'Couriers & Shipment'],
  },
  [NAVIGATION_GROUPS.STAFF]: {
    title: 'Staff Management',
    icon: CreditCard,
    labels: ['Staff', 'Staff Salaries', 'Permission', 'Manage Attendance', 'Attendance Devices Setting'],
  },
  [NAVIGATION_GROUPS.COMPANY]: {
    title: 'Company Management',
    icon: Building,
    labels: ['Profile Setting', 'Company Profile', 'Branch Management', 'Branches'],
  },
  [NAVIGATION_GROUPS.RESTAURANT]: {
    title: 'Restaurant Management',
    icon: Utensils,
    labels: ['Tables', 'Ingredient'],
  },
};

// ============== UTILITY FUNCTIONS ==============
const PermissionUtils = {
  hasPerm: (user, key) => Boolean(user?.permissions?.[key]),
  hasAny: (user, keys = []) => keys.some((k) => PermissionUtils.hasPerm(user, k)),
  hasAll: (user, keys = []) => keys.every((k) => PermissionUtils.hasPerm(user, k)),
};

const URLUtils = {
  getRoleBasePath: (role) => {
    if (role === USER_ROLES.SUPER_ADMIN) return '/superadmin';
    if (role === USER_ROLES.ADMIN) return '/admin';
    if (role === USER_ROLES.STAFF) return '/staff';
    return '/';
  },
};

const IndustryUtils = {
  isRestaurant: (industry) => industry?.toLowerCase() === INDUSTRIES.RESTAURANT.toLowerCase(),
};

// ============== NAVIGATION BUILDER ==============
class NavigationBuilder {
  static buildForSuperAdmin() {
    return [
      { href: '/superadmin/dashboard', label: 'Dashboard', icon: ICON_MAP.Dashboard },
      { href: '/superadmin/plan', label: 'Plans', icon: ICON_MAP.Plans },
      { href: '/superadmin/company', label: 'Companies', icon: ICON_MAP.Companies },
      { href: '/superadmin/profile-setting', label: 'Settings', icon: ICON_MAP.Settings },
      { href: '/superadmin/payment-gateway-config', label: 'Payment GateWay Configuration', icon: ICON_MAP.Settings },
    ];
  }

  static buildForAdmin(user) {
    const basePath = URLUtils.getRoleBasePath(USER_ROLES.ADMIN);
    const isRestaurant = IndustryUtils.isRestaurant(user?.industryName);

    const compulsoryLinks = [
      { href: `${basePath}/dashboard`, label: 'Dashboard', icon: ICON_MAP.Dashboard },
      { href: `${basePath}/product`, label: 'Product', icon: ICON_MAP.Product },
      { href: `${basePath}/orders`, label: 'Orders', icon: ICON_MAP.Orders },
      { href: `${basePath}/billing`, label: 'Billing', icon: ICON_MAP.Billing },
      { href: `${basePath}/profile-setting`, label: 'Profile Setting', icon: ICON_MAP['Profile Setting'] },
      { href: `${basePath}/setting`, label: 'Company Profile', icon: ICON_MAP.Settings },
      { href: `${basePath}/branch`, label: 'Branch Management', icon: ICON_MAP.Settings },
    ];

    const optionalLinks = [
      { href: `${basePath}/staff`, label: 'Staff', icon: ICON_MAP.Staff, extraFeature: 'Staff' },
      { href: `${basePath}/permissions`, label: 'Permission', icon: ICON_MAP.Permission, extraFeature: 'Permissions' },
      { href: `${basePath}/category`, label: 'Category', icon: ICON_MAP.Product, extraFeature: 'Category' },
      { href: `${basePath}/vendors`, label: 'Vendors', icon: ICON_MAP.Vendors, extraFeature: 'Vendors' },
      { href: `${basePath}/attendance-devices`, label: 'Attendance Devices Setting', icon: ICON_MAP.Attendance, extraFeature: 'Attendance Device' },
      { href: `${basePath}/attendance`, label: 'Manage Attendance', icon: ICON_MAP.Attendance, extraFeature: 'Manage Attendance' },
      { href: `${basePath}/staff-salaries`, label: 'Staff Salaries', icon: ICON_MAP['Staff Salaries'], extraFeature: 'Staff Salary' },
      { href: `${basePath}/couriers`, label: 'Couriers & Shipment', icon: ICON_MAP.Couriers, extraFeature: 'Courier & Shipment' },
    ];

    const restaurantLinks = isRestaurant ? [
      { href: `${basePath}/tables`, label: 'Tables', icon: ICON_MAP.Tables, extraFeature: 'Tables' },
      { href: `${basePath}/ingredient`, label: 'Ingredient', icon: ICON_MAP.Ingredient },
    ] : [];

    return [...compulsoryLinks, ...optionalLinks, ...restaurantLinks];
  }

  static buildForStaff(user) {
    const basePath = URLUtils.getRoleBasePath(USER_ROLES.STAFF);
    const isRestaurant = IndustryUtils.isRestaurant(user?.industryName);

    const alwaysShowLinks = [
      { href: `${basePath}/dashboard`, label: 'Dashboard', icon: ICON_MAP.Dashboard, alwaysShow: true },
      { href: `${basePath}/profile-setting`, label: 'Settings', icon: ICON_MAP.Settings, alwaysShow: true },
      { href: `${basePath}/branch`, label: 'Branches', icon: ICON_MAP.Settings, alwaysShow: true },
    ];

    const permissionBasedLinks = [];

    // Product permissions
    if (PermissionUtils.hasAny(user, ['createProduct', 'updateProduct', 'deleteProduct', 'viewProduct'])) {
      permissionBasedLinks.push({ href: `${basePath}/product`, label: 'Product', icon: ICON_MAP.Product });
    }

    // Billing permissions
    if (PermissionUtils.hasAny(user, ['viewBilling', 'addBilling', 'editBilling', 'deleteBilling', 'createPayment'])) {
      permissionBasedLinks.push({ href: `${basePath}/billing`, label: 'Billing', icon: ICON_MAP.Billing });
    }

    // Order permissions
    if (PermissionUtils.hasAny(user, ['createOrder', 'viewOrder', 'updateOrderStatus'])) {
      permissionBasedLinks.push({ href: `${basePath}/orders`, label: 'Orders', icon: ICON_MAP.Orders });
    }

    // Vendor permissions
    if (PermissionUtils.hasAny(user, ['createVendors', 'updateVendors', 'deleteVendors', 'viewVendors'])) {
      permissionBasedLinks.push({ href: `${basePath}/vendors`, label: 'Vendors', icon: ICON_MAP.Vendors });
    }

    // Category permissions
    if (PermissionUtils.hasAny(user, ['createCategory', 'viewCategory', 'updateCategory', 'deleteCategory'])) {
      permissionBasedLinks.push({ href: `${basePath}/category`, label: 'Category', icon: ICON_MAP.Product });
    }

    // Staff management permissions
    if (PermissionUtils.hasAny(user, ['viewallstaff', 'staffCreate', 'staffUpdate', 'staffDelete'])) {
      permissionBasedLinks.push({ href: `${basePath}/staff`, label: 'Staff', icon: ICON_MAP.Staff });
    }

    // Salary/Payment permissions
    if (PermissionUtils.hasAny(user, ['createPayment', 'viewAllStaffSalaries', 'updateSalary', 'deletePayment', 'staffSummary', 'viewActiveLog', 'viewCompanySummary'])) {
      permissionBasedLinks.push({ href: `${basePath}/staff-salaries`, label: 'Staff Salaries', icon: ICON_MAP['Staff Salaries'] });
    }

    // Attendance permissions
    if (PermissionUtils.hasAny(user, ['viewActiveLog'])) {
      permissionBasedLinks.push({ href: `${basePath}/attendance`, label: 'Manage Attendance', icon: ICON_MAP.Attendance });
    }

    // Courier permissions
    if (PermissionUtils.hasAny(user, ['createCourier', 'viewCourier', 'updateCourier', 'deleteCourier'])) {
      permissionBasedLinks.push({ href: `${basePath}/couriers`, label: 'Couriers & Shipment', icon: ICON_MAP.Couriers });
    }

    // Restaurant-specific permissions for staff
    if (isRestaurant) {
      // Table permissions
      if (PermissionUtils.hasAny(user, ['manageTables'])) {
        permissionBasedLinks.push({ href: `${basePath}/tables`, label: 'Tables', icon: ICON_MAP.Tables });
      }

      // Ingredient permissions
      if (PermissionUtils.hasAny(user, ['createProduct', 'updateProduct', 'deleteProduct', 'viewProduct'])) {
        permissionBasedLinks.push({ href: `${basePath}/ingredient`, label: 'Ingredient', icon: ICON_MAP.Ingredient });
      }
    }

    return [...alwaysShowLinks, ...permissionBasedLinks];
  }

  static buildForUser() {
    return [
      { href: '#', label: 'Dashboard', icon: ICON_MAP.Dashboard },
      { href: '#', label: 'Orders', icon: ICON_MAP.Orders },
      { href: '#', label: 'Settings', icon: ICON_MAP.Settings },
    ];
  }
}

// ============== COMPONENTS ==============
const SidebarFooter = React.memo(({ userName, userRole }) => {
  return (
    <div className="border-t border-sidebar-border/50 bg-sidebar/95 px-4 py-3 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl text-primary flex items-center justify-center">
          <User className="h-5 w-5 text-secondary" />
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
});

SidebarFooter.displayName = 'SidebarFooter';

const NavigationLink = React.memo(({ href, label, icon: Icon, isActive, onHover }) => {
  return (
    <li>
      <Link
        href={href}
        className={`group relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${isActive
          ? 'bg-linear-to-r from-primary/90 to-secondary-foreground/90 text-card font-bold border-l-4 border-secondary-foreground shadow-md shadow-secondary-foreground/10'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground border-l-4 border-transparent'
          }`}
        aria-current={isActive ? 'page' : undefined}
        onMouseEnter={() => onHover(label)}
        onMouseLeave={() => onHover(null)}
      >
        <div className="relative">
          <Icon
            className={`transition-transform duration-200 ${onHover === label ? 'scale-110' : 'scale-100'} mr-3 h-5 w-5`}
          />
        </div>
        <span className="transition-all duration-200 truncate">{label}</span>
      </Link>
    </li>
  );
});

NavigationLink.displayName = 'NavigationLink';

const GroupHeader = React.memo(({ title, icon: Icon, isOpen, onClick }) => {
  return (
    <li className="sticky top-0 z-10 bg-sidebar/95 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-sidebar-foreground/90 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-all duration-200"
      >
        <div className="flex items-center min-w-0">
          <Icon className="h-5 w-5 mr-3 shrink-0" />
          <span className="truncate">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 opacity-80 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 opacity-80 shrink-0" />
        )}
      </button>
    </li>
  );
});

GroupHeader.displayName = 'GroupHeader';

const NavigationGroup = React.memo(({
  groupKey,
  title,
  icon,
  items,
  openGroups,
  onToggleGroup,
  isActive
}) => {
  if (items.length === 0) return null;

  return (
    <>
      <GroupHeader
        title={title}
        icon={icon}
        isOpen={openGroups[groupKey]}
        onClick={() => onToggleGroup(groupKey)}
      />
      {openGroups[groupKey] && (
        <ul className="space-y-1 mt-1 ml-4 pl-2">
          {items.map((item) => (
            <NavigationLink
              key={`${groupKey}-${item.label}`}
              {...item}
              isActive={isActive(item.href)}
              onHover={() => { }}
            />
          ))}
        </ul>
      )}
    </>
  );
});

NavigationGroup.displayName = 'NavigationGroup';

const LoadingSpinner = () => (
  <div className="flex flex-1 items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      <p className="text-sidebar-accent-foreground/70 text-sm">Loading...</p>
    </div>
  </div>
);

// ============== MAIN SIDEBAR COMPONENT ==============
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [openGroups, setOpenGroups] = useState({
    [NAVIGATION_GROUPS.INVENTORY]: true,
    [NAVIGATION_GROUPS.STAFF]: true,
    [NAVIGATION_GROUPS.COMPANY]: true,
    [NAVIGATION_GROUPS.RESTAURANT]: true,
  });

  const { data: companyRes } = useGetCompanyQuery();
  const companyName = companyRes?.data?.name || 'Your Company';
  const authUser = useSelector((state) => state.auth.user);
  const isSettingsMode = pathname?.startsWith('/settings');

  // Sync user from Redux to local state
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    }
  }, [authUser]);

  // Navigation helpers
  const isActive = useCallback((href) =>
    pathname === href || pathname.startsWith(`${href}/`),
    [pathname]
  );

  const toggleGroup = useCallback((key) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] })),
    []
  );

  // Build navigation based on user role
  const navigationLinks = useMemo(() => {
    if (!user?.role) return [];

    switch (user.role.toLowerCase()) {
      case USER_ROLES.SUPER_ADMIN:
        return NavigationBuilder.buildForSuperAdmin();

      case USER_ROLES.ADMIN:
        const adminLinks = NavigationBuilder.buildForAdmin(user);
        return adminLinks.filter(link => {
          if (link.compulsory) return true;
          if (!link.extraFeature) return true;
          return Array.isArray(user?.extraFeature) && user.extraFeature.includes(link.extraFeature);
        });

      case USER_ROLES.STAFF:
        return NavigationBuilder.buildForStaff(user);

      default:
        return [];
    }
  }, [user]);

  // Group navigation items
  const groupedNavigation = useMemo(() => {
    const groups = {};
    const ungroupedLinks = [];

    // Initialize groups
    Object.values(NAVIGATION_GROUPS).forEach(groupKey => {
      groups[groupKey] = [];
    });

    // Categorize links
    navigationLinks.forEach(link => {
      let foundGroup = false;

      Object.entries(GROUP_CONFIGS).forEach(([groupKey, config]) => {
        if (config.labels.includes(link.label)) {
          groups[groupKey].push(link);
          foundGroup = true;
        }
      });

      if (!foundGroup) {
        ungroupedLinks.push(link);
      }
    });

    return { groups, ungroupedLinks };
  }, [navigationLinks]);

  // Filter out empty groups
  const nonEmptyGroups = useMemo(() =>
    Object.entries(groupedNavigation.groups).filter(([_, items]) => items.length > 0),
    [groupedNavigation.groups]
  );

  // Handle back to main navigation
  const handleBackToMain = useCallback(() => {
    const mainRoute = navigationLinks[0]?.href || '/dashboard';
    router.push(mainRoute);
  }, [navigationLinks, router]);

  // Debug logging - MOVED BEFORE CONDITIONAL RETURN
  useEffect(() => {
    if (user) {
      console.log('=== SIDEBAR DEBUG ===');
      console.log('User Role:', user?.role);
      console.log('User SubRole:', user?.subRole);
      console.log('Navigation Links:', navigationLinks.map(l => l.label));
      console.log('Grouped Items:', groupedNavigation);
      console.log('===================');
    }
  }, [user, navigationLinks, groupedNavigation]);

  // Early return must be AFTER all hooks
  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-linear-to-b from-sidebar to-sidebar/95 backdrop-blur-xl shadow-xl border-r border-sidebar-border/30 flex flex-col z-50">
      {/* Header */}
      <div className="px-6 py-5 border-b border-sidebar-border/30 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-primary bg-clip-text text-transparent truncate">
              {companyName}
            </h1>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {isSettingsMode ? (
          <div className="flex flex-1 flex-col">
            <div className="px-3 py-4">
              <button
                onClick={handleBackToMain}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-all duration-200 hover:gap-3"
                aria-label="Back to Main"
                title="Back to Main"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Main</span>
              </button>
            </div>
          </div>
        ) : (
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3">
            <ul className="space-y-1">
              {/* Non-grouped items */}
              {groupedNavigation.ungroupedLinks.map((link) => (
                <NavigationLink
                  key={link.href}
                  {...link}
                  isActive={isActive(link.href)}
                  onHover={setHoveredItem}
                />
              ))}

              {/* Grouped items */}
              {nonEmptyGroups.map(([groupKey, items]) => {
                const config = GROUP_CONFIGS[groupKey];
                return (
                  <NavigationGroup
                    key={groupKey}
                    groupKey={groupKey}
                    title={config.title}
                    icon={config.icon}
                    items={items}
                    openGroups={openGroups}
                    onToggleGroup={toggleGroup}
                    isActive={isActive}
                  />
                );
              })}
            </ul>
          </nav>
        )}

        {/* Footer */}
        <div className="shrink-0">
          <SidebarFooter
            userName={user?.name}
            userRole={user?.subRole || user?.role}
          />
        </div>
      </div>
    </aside>
  );
}