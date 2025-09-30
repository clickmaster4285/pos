// File: navbar.js
'use client';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import {
  FiSearch,
  FiBell,
  FiUser,
  FiMenu,
  FiX,
  FiGlobe,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useLogoutMutation } from '@/features/authApi';

import { toast } from 'sonner';
import { Car, FileText, Settings, Users } from 'lucide-react';
import Home from '../landing/Hero';
import { Button } from '../ui/button';

export default function Navbar({setErrorMessage}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const user = useSelector((state) => state.auth.user);
  const [logout] = useLogoutMutation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, text: 'New message from Sarah', time: '10 min ago', read: false },
    {
      id: 2,
      text: 'Your post was liked by 25 people',
      time: '1 hour ago',
      read: true,
    },
    { id: 3, text: 'New feature available', time: '2 days ago', read: true },
  ];

  const handleLogOut = async () => {
    try {
      await logout().unwrap();
      setIsProfileOpen(false);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setErrorMessage('Logout failed. Please try again.');
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <nav className="w-full bg-background border-b border-gray-200">
      <div className="h-16 flex justify-between px-6 relative mt-3">
        {/* Mobile menu button */}
        <div className="flex ">
          <Button
            className="md:hidden text-primary-700 mr-4 text-xl"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </Button>

          {/* Logo / Brand */}
          {/* <div className="flex items-center gap-3  py-4 ">
            <div>
              <h2 className="font-bold text-lg text-foreground">AutoAdmin</h2>
              <p className="text-xs text-muted-foreground">
                Super Administrator
              </p>
            </div>
          </div> */}

          {/* Search Bar */}
          <div className="hidden md:flex items-center align-middle gap-2 bg-muted rounded-lg mx-6 mt-2 px-3 py-2 h-11 w-96">
            <FiSearch className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search vehicles, dealers, reports..."
              className="bg-transparent border-none outline-none flex-1 text-sm"
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
              className="relative"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <FiBell className="w-5 h-5" />
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </Button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-200 bg-primary-50 text-gray-700 font-medium">
                  Notifications
                </div>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <p className="text-sm text-gray-800">
                        {notification.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No new notifications
                  </div>
                )}
                <div className="px-4 py-2 border-t border-gray-200 text-center bg-gray-50">
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center text-primary-700 hover:text-gray-900 transition-colors duration-200 p-2"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <FiUser className="text-primary-700" />
                </div>
              )}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
                <div className="py-1">
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <FiUser className="mr-2" />
                      View Profile
                    </div>
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <FiSettings className="mr-2" />
                      Settings
                    </div>
                  </a>
                  <button
                    onClick={handleLogOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-200"
                  >
                    <div className="flex items-center">
                      <FiLogOut className="mr-2" />
                      Logout
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 space-y-3 shadow-lg z-40">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="bg-gray-100 text-gray-700 placeholder-gray-400 rounded-md py-2 px-4 pl-10 w-full outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex flex-col space-y-2 text-gray-700">
              <button className="flex items-center py-2 px-4 hover:bg-gray-50 rounded-md transition-colors duration-200">
                <FiGlobe className="mr-3" />
                <span>Language</span>
              </button>
              <button
                className="flex items-center py-2 px-4 hover:bg-gray-50 rounded-md transition-colors duration-200"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <FiBell className="mr-3" />
                <span>Notifications</span>
                {notifications.filter((n) => !n.read).length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogOut();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-200"
              >
                <div className="flex items-center">
                  <FiLogOut className="mr-2" />
                  <span>Logout</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
