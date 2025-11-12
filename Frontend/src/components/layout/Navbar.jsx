// File: Navbar.jsx
'use client';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import {
  FiSearch,
  FiBell,
  FiUser,
  FiMenu,
  FiX,
  FiSettings,
  FiLogOut,
  FiDownload,
  FiUpload,
  FiDatabase,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiTrash2,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useLogoutMutation } from '@/features/authApi';
import { 
  useExportDataMutation, 
  useImportDataMutation, 
  useGetBackupInfoQuery,
  useCleanupTempFilesMutation,
} from '@/features/dataManagementApi';
import { Button } from '../ui/button';
import Link from 'next/link';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStage, setImportStage] = useState('');
  
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const dataMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
  const [logout] = useLogoutMutation();
  
  // Data management mutations and queries
  const [exportData] = useExportDataMutation();
  const [importData] = useImportDataMutation();
  const [cleanupTempFiles] = useCleanupTempFilesMutation();
  const { data: backupInfo, refetch: refetchBackupInfo, isLoading: isLoadingBackupInfo } = useGetBackupInfoQuery(undefined, {
    skip: user?.role !== 'superAdmin',
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (dataMenuRef.current && !dataMenuRef.current.contains(event.target)) {
        setIsDataMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enhanced Export Handler
  const handleExportData = async () => {

    setIsExporting(true);
    try {
      const result = await exportData({}).unwrap();
      if (result.success) {
        refetchBackupInfo();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setIsDataMenuOpen(false);
    }
  };

  // Enhanced Import Handler
  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      return;
    }


    setIsImporting(true);
    setImportProgress(0);
    setImportStage('Preparing upload...');
    
    const formData = new FormData();
    formData.append('backupFile', file);

    try {
      // Simulate progress for better UX
      const progressStages = [
        { stage: 'Uploading file...', progress: 25 },
        { stage: 'Extracting backup...', progress: 50 },
        { stage: 'Validating data...', progress: 70 },
        { stage: 'Restoring database...', progress: 85 },
        { stage: 'Finalizing...', progress: 95 }
      ];

      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          setImportStage(progressStages[currentStage].stage);
          setImportProgress(progressStages[currentStage].progress);
          currentStage++;
        } else {
          clearInterval(progressInterval);
        }
      }, 1000);

      const result = await importData(formData).unwrap();
      
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportStage('Import completed!');
      
      if (result.success) {
        
        // refetchBackupInfo();
        
        // Refresh the page after successful import to ensure clean state
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportStage('Import failed!');
    } finally {
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
        setImportStage('');
        setIsDataMenuOpen(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    }
  };

  const handleCleanupTempFiles = async () => {


    try {
      const result = await cleanupTempFiles().unwrap();
      if (result.success) {
        refetchBackupInfo();
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getSettingsRoute = () => {
    if (!user?.role) return '/settings/profile';
    if (user.role === 'superAdmin') return '/superadmin/profile-setting';
    if (user.role === 'admin') return '/admin/profile-setting';
    if (user.role === 'staff' && user.subRole) {
      return `/staff/${encodeURIComponent(user.subRole)}/profile-setting`;
    }
    return '/staff/profile-setting';
  };

  const handleLogOut = async () => {
    try {
      await logout().unwrap();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const unreadNotificationsCount = 2; // Replace with actual count

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
          {/* Data Management Menu - Only for Super Admin */}
          {user?.role === 'superAdmin' && (
            <div className="relative" ref={dataMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-blue-50 hover:text-blue-600 transition-colors"
                onClick={() => setIsDataMenuOpen(!isDataMenuOpen)}
                title="Data Management"
              >
                <FiDatabase className="w-5 h-5" />
              </Button>

              {isDataMenuOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FiDatabase className="w-5 h-5 text-blue-600 mr-2" />
                        <h3 className="text-sm font-semibold text-gray-800">Data Management</h3>
                      </div>
                      <FiInfo className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* System Info */}
                  {!isLoadingBackupInfo && backupInfo?.success && (
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Database:</span>
                          <div className="font-medium">{backupInfo.data.database.name}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Uploads:</span>
                          <div className="font-medium">
                            {backupInfo.data.uploads.fileCount} files ({backupInfo.data.uploads.sizeMB}MB)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Export Section */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Export All Data</span>
                      <FiDownload className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Download complete database and uploads as ZIP file
                    </p>
                    <button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="w-full flex items-center justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isExporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <FiDownload className="mr-2 w-4 h-4" />
                          Export Now
                        </>
                      )}
                    </button>
                  </div>

                  {/* Import Section */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Import Backup</span>
                      <FiUpload className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Restore from previously exported ZIP backup
                    </p>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip"
                      onChange={handleImportData}
                      className="hidden"
                      disabled={isImporting}
                    />
                    
                    <button
                      onClick={triggerFileInput}
                      disabled={isImporting}
                      className="w-full flex items-center justify-center py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mb-3"
                    >
                      {isImporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Importing...
                        </>
                      ) : (
                        <>
                          <FiUpload className="mr-2 w-4 h-4" />
                          Choose Backup File
                        </>
                      )}
                    </button>

                    {/* Progress bar */}
                    {isImporting && (
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">{importStage}</span>
                          <span className="text-gray-600">{importProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${importProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Warning */}
                    <div className="flex items-start p-2 bg-yellow-50 rounded border border-yellow-200">
                      <FiAlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-700">
                        This will replace all current data. Make sure you have a backup.
                      </p>
                    </div>
                  </div>

                  {/* Cleanup Section */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Cleanup Temporary Files</span>
                      <FiTrash2 className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Remove temporary backup files to free up disk space
                    </p>
                    <button
                      onClick={handleCleanupTempFiles}
                      className="w-full flex items-center justify-center py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm"
                    >
                      <FiTrash2 className="mr-2 w-4 h-4" />
                      Cleanup Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-800">{user?.name || 'User'}</p>
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

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 space-y-3 shadow-lg z-40">
            {/* Mobile Data Management - Only for Super Admin */}
            {user?.role === 'superAdmin' && (
              <div className="border-t border-gray-200 pt-3">
                <div className="text-sm font-medium text-gray-700 mb-2">Data Management</div>
                
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full flex items-center justify-between py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50 mb-2"
                >
                  <div className="flex items-center">
                    <FiDownload className="mr-2" />
                    Export All Data
                  </div>
                  {isExporting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>}
                </button>

                <button
                  onClick={triggerFileInput}
                  disabled={isImporting}
                  className="w-full flex items-center justify-between py-3 px-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50 mb-2"
                >
                  <div className="flex items-center">
                    <FiUpload className="mr-2" />
                    Import Backup
                  </div>
                  {isImporting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleImportData}
                  className="hidden"
                  disabled={isImporting}
                />

                {isImporting && (
                  <div className="space-y-2 mb-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">{importStage}</span>
                      <span className="text-gray-600">{importProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCleanupTempFiles}
                  className="w-full flex items-center justify-between py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  <div className="flex items-center">
                    <FiTrash2 className="mr-2" />
                    Cleanup Files
                  </div>
                </button>
              </div>
            )}

            {/* Other mobile menu items */}
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