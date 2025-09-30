"use client";

import React, { useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
} from "lucide-react";

const iconMap = {
  Dashboard: LayoutDashboard,
  Plans: FileText,
  Companies: Building,
  Users: User,
  "Payment / Billing": CreditCard,
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
  "Live Store": Store,
  Attendance: ClipboardList,
  "Staff Saleries": CreditCard,
};

function SidebarFooter({ userName, userRole }) {
  return (
    <div className="sticky bottom-0 border-t border-sidebar-border bg-sidebar/90 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-radius-md bg-gradient-primary flex items-center justify-center">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            {userName || "Guest"}
          </p>
          <p className="truncate text-xs text-sidebar-accent-foreground capitalize">
            {userRole || "unauthenticated"}
          </p>
        </div>
        <Link
          href="/settings/profile"
          className="flex h-9 w-9 items-center justify-center rounded-radius-md text-sidebar-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-animation-normal"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  const isSettingsMode = pathname?.startsWith("/settings");

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  // Get user data from session storage on component mount
  useEffect(() => {
    const authState = getAuthState();
    if (authState) {
      setUser(authState);
    }
    setLoading(false);
  }, []);

  const roleBasedLinks = useMemo(
    () => ({
      superAdmin: [
        { href: "/superadmin/dashboard", label: "Dashboard", icon: iconMap["Dashboard"] },
        { href: "/superadmin/plan", label: "Plans", icon: iconMap["Plans"] },
        { href: "/superadmin/company", label: "Companies", icon: iconMap["Companies"] },
        { href: "#", label: "Users", icon: iconMap["Users"] },
        { href: "#", label: "Payment / Billing", icon: iconMap["Payment / Billing"] },
        { href: "#", label: "Settings", icon: iconMap["Settings"] },
      ],
      admin: [
        { href: "/admin/dashboard", label: "Dashboard", icon: iconMap["Dashboard"] },
        { href: "/admin/staff", label: "Staff", icon: iconMap["Staff"] },
        { href: "#", label: "Permission", icon: iconMap["Permission"] },
        { href: "/admin/inventory", label: "Inventory", icon: iconMap["Inventory"] },
        { href: "#", label: "Billing", icon: iconMap["Billing"] },
        { href: "/admin/vendors", label: "Vendors", icon: iconMap["Vendors"] },
        { href: "#", label: "Customers", icon: iconMap["Customers"] },
        { href: "/admin/orders", label: "Orders", icon: iconMap["Orders"] },
        { href: "#", label: "Sumeries", icon: iconMap["Sumeries"] },
        { href: "#", label: "Reports", icon: iconMap["Reports"] },
        { href: "#", label: "Live Store", icon: iconMap["Live Store"] },
        { href: "#", label: "Attendance", icon: iconMap["Attendance"] },
        { href: "#", label: "Staff Saleries", icon: iconMap["Staff Saleries"] },
        { href: "#", label: "Settings", icon: iconMap["Settings"] },
      ],
      staff: [
        { href: "#", label: "Vendor Dashboard", icon: iconMap["Dashboard"] },
        { href: "#", label: "Orders", icon: iconMap["Orders"] },
        { href: "#", label: "Inventory", icon: iconMap["Inventory"] },
        { href: "#", label: "Settings", icon: iconMap["Settings"] },
      ],
      user: [
        { href: "#", label: "Dashboard", icon: iconMap["Dashboard"] },
        { href: "#", label: "Orders", icon: iconMap["Orders"] },
        { href: "#", label: "Settings", icon: iconMap["Settings"] },
      ],
      guest: [],
    }),
    []
  );

  const mainLinks = useMemo(() => {
    if (loading || !user?.role) return roleBasedLinks.guest;
    return roleBasedLinks[user.role] || roleBasedLinks.guest;
  }, [user, loading, roleBasedLinks]);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-sidebar-border bg-sidebar shadow-shadow-sm flex flex-col transition-all duration-animation-normal">
      <div className="px-6 py-5">
        <h1 className="text-xl font-bold text-primary">AutoMotive</h1>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sidebar-accent-foreground animate-pulse">Loading...</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          {!isSettingsMode ? (
            <>
              <nav className="flex-1 overflow-y-auto px-3">
                <ul className="space-y-1">
                  {mainLinks.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <li key={label}>
                        <Link
                          href={href}
                          className={`flex items-center rounded-radius-md px-3 py-2 text-sm font-medium transition-colors duration-animation-normal ${
                            active
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-shadow-sm"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                          {label}
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
              <div className="px-3 py-2">
                <button
                  onClick={() => router.push(mainLinks[0]?.href || "/dashboard")}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors duration-animation-normal"
                  aria-label="Back to Main"
                  title="Back to Main"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to Main</span>
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