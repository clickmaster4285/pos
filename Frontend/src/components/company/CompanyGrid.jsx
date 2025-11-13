// src/components/company/CompanyGrid.jsx
'use client';

import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, XCircle, Download, Upload } from 'lucide-react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Calendar,
  Users,
  Package,
  FileText,
} from 'lucide-react';
import { useExportCompanyDataMutation, useImportCompanyDataMutation } from '@/features/dataManagementApi';

const safe = (v) => (typeof v === 'string' ? v : '—');
const getId = (c) => c?.id ?? c?._id ?? c?.companyId ?? '';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const num = (v) => (Number.isFinite(v) ? v : 0);

function statusVariant(isActive) {
  return isActive ? 'active' : 'reject';
}

export function CompanyGrid({
  items = [],
  handleToggle,
  handleVerify,
  pendingId,
  showUnverified = false,
  isVerifying,
  onDetail,
}) {
  const [exportCompanyData, { isLoading: isExporting }] = useExportCompanyDataMutation();
  const [importCompanyData, { isLoading: isImporting }] = useImportCompanyDataMutation();
  const fileInputRef = useRef(null);

  // Handle company export
  const handleCompanyExport = async (companyId, companyName, e) => {
    e.stopPropagation();
    try {
      console.log("i send to api", companyId)
      const response = await exportCompanyData(companyId).unwrap();
      
      // Create download link
      const blob = new Blob([response], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `company-${companyName}-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`Export successful for company: ${companyName}`);
    } catch (error) {
      console.error('Export failed:', error);
      // You can add toast notification here
      alert(`Export failed: ${error.data?.message || error.message}`);
    }
  };

  // Handle company import
  const handleCompanyImport = async (companyId, file) => {
    const formData = new FormData();
    formData.append('backupFile', file);
    
    try {
      const result = await importCompanyData({ companyId, formData }).unwrap();
      console.log(`Import successful for company: ${companyId}`, result);
      alert(`Import successful! ${result.message}`);
      // Refresh company data or show success message
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error.data?.message || error.message}`);
    }
  };

  const triggerFileInput = (companyId, e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-company-id', companyId);
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    const companyId = e.target.getAttribute('data-company-id');
    
    if (file && companyId) {
      if (!file.name.endsWith('.zip')) {
        alert('Please select a ZIP file');
        return;
      }
      handleCompanyImport(companyId, file);
    }
    
    // Reset input
    e.target.value = '';
  };

  if (!items?.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No companies found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {showUnverified 
            ? "All company applications have been processed."
            : "No companies match your current filters."
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {items.map((company) => {
          const id = getId(company);
          const isPending = pendingId === id;

          const usersCount = Array.isArray(company?.gain?.staff)
            ? company.gain.staff.length
            : 0;
          const vendorsCount = num(company?.gain?.vendor);
          const productCount = num(company?.gain?.product);
          const planCount = Array.isArray(company?.plan)
            ? company.plan.length
            : 0;

          return (
            <Card
              key={id}
              className="group relative overflow-hidden border-border/60 bg-card rounded-xl transition-all duration-300 hover:shadow-lg hover:border-border/80 cursor-pointer"
              onClick={() => onDetail?.(company)}
            >
              {/* Header */}
              <div className="p-5 pb-4 border-b border-border/50">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary grid place-items-center shrink-0">
                    <Building2 className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-lg text-foreground truncate">
                          {safe(company.name)}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {safe(company.industry)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={statusVariant(!!company.isActive)}
                          className="h-6 px-2 text-xs font-medium"
                        >
                          {company.isActive ? 'Active' : 'Inactive'}
                        </Badge>

                        {showUnverified ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleVerify(id, 'reject'); }}
                              disabled={isVerifying || isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleVerify(id, 'approve'); }}
                              disabled={isVerifying || isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-60 hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Company Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              <HoverCard openDelay={100} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                  <DropdownMenuItem className="cursor-default">
                                    Change Status
                                  </DropdownMenuItem>
                                </HoverCardTrigger>
                                <HoverCardContent side="right" align="start" className="w-64">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">
                                        Set Active
                                      </span>
                                      <Switch
                                        checked={!!company.isActive}
                                        onCheckedChange={() => handleToggle?.(company)}
                                        disabled={isPending}
                                      />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Toggle to {company.isActive ? 'deactivate' : 'activate'} this company.
                                    </p>
                                    <Button
                                      size="sm"
                                      className="w-full"
                                      onClick={() => handleToggle?.(company)}
                                      disabled={isPending}
                                    >
                                      {isPending
                                        ? 'Updating…'
                                        : company.isActive
                                        ? 'Deactivate'
                                        : 'Activate'}
                                    </Button>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>

                              {/* Backup Options */}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => handleCompanyExport(company.companyId, company.name, e)}
                                disabled={isExporting}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                {isExporting ? 'Exporting...' : 'Backup ZIP'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => triggerFileInput(company.companyId, e)}
                                disabled={isImporting}
                                className="flex items-center gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                {isImporting ? 'Importing...' : 'Restore Backup'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plans */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {Array.isArray(company.plan) && company.plan.length > 0 ? (
                    company.plan.map((pl, idx) => (
                      <Badge
                        key={pl._id || idx}
                        variant="outline"
                        className="text-xs font-normal bg-primary/5"
                      >
                        {safe(pl.name)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No Plans
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-foreground truncate">{safe(company.contactEmail)}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">{safe(company.contactPhone)}</span>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <span className="text-foreground line-clamp-2">{safe(company.address)}</span>
                </div>
              </div>

              {/* Stats & Footer */}
              <div className="px-5 py-4 bg-muted/30 border-t border-border/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="font-medium text-foreground">{usersCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span className="font-medium text-foreground">{vendorsCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span className="font-medium text-foreground">{productCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">{planCount} plans</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {fmtDate(company.createdAt)}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}