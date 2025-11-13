// components/DataManagementMenu.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  FiDownload,
  FiUpload,
  FiDatabase,
  FiTrash2,
  FiInfo,
  FiAlertCircle,
} from "react-icons/fi";
import {
  useExportDataMutation,
  useImportDataMutation,
  useGetBackupInfoQuery,
  useCleanupTempFilesMutation,
} from "@/features/dataManagementApi";
import { Button } from "@/components/ui/button";

export default function DataManagementMenu({ isMobile = false }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStage, setImportStage] = useState("");

  const fileInputRef = useRef(null);

  const [exportData] = useExportDataMutation();
  const [importData] = useImportDataMutation();
  const [cleanupTempFiles] = useCleanupTempFilesMutation();
  const { data: backupInfo, refetch: refetchBackupInfo, isLoading: isLoadingBackupInfo } =
    useGetBackupInfoQuery(undefined, { skip: false });

  // -----------------------------------------------------------------
  // Export
  // -----------------------------------------------------------------
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportData({}).unwrap();
      if (res.success) refetchBackupInfo();
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  // -----------------------------------------------------------------
  // Import
  // -----------------------------------------------------------------
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".zip")) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportStage("Preparing upload...");

    const formData = new FormData();
    formData.append("backupFile", file);

    // fake progress for UX
    const stages = [
      { stage: "Uploading file...", progress: 25 },
      { stage: "Extracting backup...", progress: 50 },
      { stage: "Validating data...", progress: 70 },
      { stage: "Restoring database...", progress: 85 },
      { stage: "Finalizing...", progress: 95 },
    ];
    let i = 0;
    const iv = setInterval(() => {
      if (i < stages.length) {
        setImportStage(stages[i].stage);
        setImportProgress(stages[i].progress);
        i++;
      } else clearInterval(iv);
    }, 1000);

    try {
      const res = await importData(formData).unwrap();
      clearInterval(iv);
      setImportProgress(100);
      setImportStage("Import completed!");

      if (res.success) {
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch (e) {
      console.error("Import error:", e);
      setImportStage("Import failed!");
    } finally {
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
        setImportStage("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 2000);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  // -----------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------
  const handleCleanup = async () => {
    try {
      const res = await cleanupTempFiles().unwrap();
      if (res.success) refetchBackupInfo();
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  };

  // -----------------------------------------------------------------
  // Render (desktop version)
  // -----------------------------------------------------------------
  if (!isMobile) {
    return (
      <div className="relative w-full max-w-4xl mx-auto">
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <FiDatabase className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Data Management</h3>
                  <p className="text-sm text-muted-foreground">Manage your database and backups</p>
                </div>
              </div>
              <FiInfo className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* System Info */}
          {!isLoadingBackupInfo && backupInfo?.success && (
            <div className="p-6 bg-muted/30 border-b border-border">
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <FiDatabase className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Database</div>
                    <div className="font-semibold text-foreground">{backupInfo.data.database.name}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
            {/* Export */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <FiDownload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Export All Data</h4>
                  <p className="text-sm text-muted-foreground">Download complete database</p>
                </div>
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <FiDownload className="w-4 h-4" />
                    Export Now
                  </>
                )}
              </button>
            </div>

            {/* Import */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <FiUpload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Import Backup</h4>
                  <p className="text-sm text-muted-foreground">Restore from exported ZIP backup</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleImport}
                className="hidden"
                disabled={isImporting}
              />

              <button
                onClick={triggerFileInput}
                disabled={isImporting}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-border shadow-lg hover:shadow-xl"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-foreground border-t-transparent"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <FiUpload className="w-4 h-4" />
                    Choose Backup File
                  </>
                )}
              </button>

              {isImporting && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{importStage}</span>
                    <span className="text-muted-foreground">{importProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Cleanup */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-xl">
                  <FiTrash2 className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Cleanup Temporary Files</h4>
                  <p className="text-sm text-muted-foreground">Remove temporary files to free up disk space</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCleanup}
                  className="flex items-center justify-center gap-2 py-3 px-6 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Cleanup Now
                </button>
                
                <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-xl border border-warning/20">
                  <FiAlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-warning-foreground">
                    This will replace all current data. Make sure you have a backup.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // Mobile version
  // -----------------------------------------------------------------
  return (
    <div className="w-full max-w-md mx-auto space-y-4 p-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-foreground">Data Management</h3>
        <p className="text-sm text-muted-foreground">Manage your database and backups</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center justify-between p-4 bg-card hover:bg-card/80 text-foreground rounded-2xl border border-border transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center gap-3">
            <FiDownload className="w-5 h-5 text-primary" />
            <span className="font-medium">Export All Data</span>
          </div>
          {isExporting && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          )}
        </button>

        <button
          onClick={triggerFileInput}
          disabled={isImporting}
          className="w-full flex items-center justify-between p-4 bg-card hover:bg-card/80 text-foreground rounded-2xl border border-border transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center gap-3">
            <FiUpload className="w-5 h-5 text-primary" />
            <span className="font-medium">Import Backup</span>
          </div>
          {isImporting && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleImport}
          className="hidden"
          disabled={isImporting}
        />

        {isImporting && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-2xl">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{importStage}</span>
              <span className="text-muted-foreground">{importProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <button
          onClick={handleCleanup}
          className="w-full flex items-center justify-between p-4 bg-card hover:bg-card/80 text-foreground rounded-2xl border border-destructive/20 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center gap-3">
            <FiTrash2 className="w-5 h-5 text-destructive" />
            <span className="font-medium">Cleanup Files</span>
          </div>
        </button>
      </div>

      <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-xl border border-warning/20 mt-4">
        <FiAlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
        <p className="text-xs text-warning-foreground">
          Import will replace all current data. Make sure you have a backup.
        </p>
      </div>
    </div>
  );
}