// Navbar.jsx
"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  FiSearch,
  FiBell,
  FiUser,
  FiMenu,
  FiX,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useLogoutMutation } from "@/features/authApi";
import { Button } from "../ui/button";
import Link from "next/link";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
  const [logout] = useLogoutMutation();

  // -----------------------------------------------------------------
  // Click-outside handling (profile & notifications only)
  // -----------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -----------------------------------------------------------------
  // Logout
  // -----------------------------------------------------------------
  const handleLogOut = async () => {
    try {
      await logout().unwrap();
      router.push("/login");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  // -----------------------------------------------------------------
  // Settings route helper
  // -----------------------------------------------------------------
  const getSettingsRoute = () => {
    if (!user?.role) return "/settings/profile";
    if (user.role === "superAdmin") return "/superadmin/profile-setting";
    if (user.role === "admin") return "/admin/profile-setting";
    if (user.role === "staff" && user.subRole)
      return `/staff/${encodeURIComponent(user.subRole)}/profile-setting`;
    return "/staff/profile-setting";
  };

  const unreadNotificationsCount = 2; // replace with real count later

  return (
    <nav className="p-3 w-full bg-sidebar border-b border-gray-200">
      <div className="h-14 flex justify-between px-6 relative">
        {/* Mobile menu button */}
        <div className="flex">
          <Button
            className="md:hidden text-primary-700 mr-4 text-xl"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </Button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center align-middle gap-2 rounded-lg mx-6 mt-2 px-3 py-2 h-11 w-96 bg-muted-foreground/20">
            <FiSearch className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search vehicles, dealers, reports..."
              className="border-none outline-none flex-1 text-sm bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop navigation */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-gray-50 transition-colors"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <FiBell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </Button>
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center text-primary-700 hover:text-gray-900 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-50"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              {user?.avatar ? (
                <Image src={user.avatar} alt="Profile" width={32} height={32} className="rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <FiUser className="text-primary-700" />
                </div>
              )}
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-800">{user?.name || "User"}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-blue-600 font-medium capitalize">{user?.role}</p>
                </div>
                <div className="p-1">
                  <Link
                    href={getSettingsRoute()}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <FiSettings className="mr-3 w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleLogOut}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left"
                  >
                    <FiLogOut className="mr-3 w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu – only settings & logout */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 space-y-3 shadow-lg z-40">
            <div className="flex flex-col space-y-2 text-gray-700 border-t border-gray-200 pt-3">
              <Link
                href={getSettingsRoute()}
                className="flex items-center py-2 px-4 hover:bg-gray-50 rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FiSettings className="mr-3" />
                <span>Settings</span>
              </Link>
              <button
                onClick={handleLogOut}
                className="flex items-center py-2 px-4 hover:bg-gray-50 rounded-md transition-colors duration-200 text-left"
              >
                <FiLogOut className="mr-3" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}