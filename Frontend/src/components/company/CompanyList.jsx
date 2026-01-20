// src/components/company/CompanyList.jsx
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react';
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

// **NEW IMPORTS**
import { useExportCompanyExcelMutation } from '@/features/companyExcelApi';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useState } from 'react';

// --------------------------------------------------------------
const safe = (v) => (typeof v === 'string' ? v : '—');
const getId = (c) => c?.id ?? c?._id ?? c?.companyId ?? '';

function statusVariant(isActive) {
  return isActive ? 'active' : 'reject';
}

// --------------------------------------------------------------
export function CompanyList({
  items = [],
  handleToggle,
  handleVerify,
  pendingId,
  showUnverified = false,
  isVerifying,
  onDetail,
}) {
  // ---------- global export state ----------
  const [exportExcel, { isLoading: isExportingExcel }] = useExportCompanyExcelMutation();
  const [isExporting, setIsExporting] = useState(false);

  // ---------- per-company export ----------
  const handleExport = async (companyId, companyName, e) => {
    e.stopPropagation();               // prevent row click
    setIsExporting(true);
    try {
      console.log("teh companyId are: ", companyId)
      const response = await exportExcel(companyId).unwrap();
      const blob = new Blob([response], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyName.replace(/[^a-z0-9]/gi, '_')}_export_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err?.data?.message || err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // --------------------------------------------------------------
  if (!items?.length) {
    return (
      <Card className="border-border/60">
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No companies found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {showUnverified
              ? 'All company applications have been processed.'
              : 'No companies match your current filters.'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* ---- GLOBAL LOADING OVERLAY ---- */}
      <LoadingOverlay isOpen={isExporting} />

      <Card className="border-border/60 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 items-center px-6 py-4 border-b border-border/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-4">Company</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-3">Address</div>
          <div className="col-span-2">Stats</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/50">
          {items.map((c) => {
            const id = getId(c);
            const isPending = pendingId === id;
            const plans = Array.isArray(c.plan) ? c.plan : [];
            const usersCount = Array.isArray(c?.gain?.staff) ? c.gain.staff.length : 0;
            const vendorsCount = c?.gain?.vendor || 0;
            const productCount = c?.gain?.product || 0;

            return (
              <div
                key={id}
                className="grid grid-cols-12 items-center px-6 py-4 hover:bg-muted/20 transition-colors group"
              >
                {/* Company – CLICKABLE */}
                <div className="col-span-4 cursor-pointer" onClick={() => onDetail?.(c)}>
                  {/* … existing company column … */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary grid place-items-center shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{safe(c.name)}</p>
                      <p className="text-sm text-muted-foreground truncate">{safe(c.industry)}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {plans.length > 0 ? (
                          plans.slice(0, 2).map((pl, idx) => (
                            <Badge
                              key={pl?._id || idx}
                              variant="outline"
                              className="text-[10px] font-normal bg-primary/5"
                            >
                              {safe(pl?.name)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground">No Plans</span>
                        )}
                        {plans.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{plans.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{safe(c.contactEmail)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{safe(c.contactPhone)}</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="line-clamp-2">{safe(c.address)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="col-span-2">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="col-span-1">
                  <div className="flex items-center justify-end gap-2">
                    <Badge
                      variant={statusVariant(!!c.isActive)}
                      className="text-xs font-medium"
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </Badge>

                    {/* ---- EXPORT EXCEL BUTTON (per row) ---- */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={(e) => handleExport(c.companyId, c.name, e)}
                      disabled={isExporting}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Excel
                    </Button>

                    {showUnverified ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleVerify(id, 'reject')}
                          disabled={isVerifying || isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleVerify(id, 'approve')}
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
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            <HoverCardContent side="left" align="start" className="w-64">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Set Active</span>
                                  <Switch
                                    checked={!!c.isActive}
                                    onCheckedChange={() => handleToggle?.(c)}
                                    disabled={isPending}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Toggle to {c.isActive ? 'deactivate' : 'activate'} this company.
                                </p>
                                <Button
                                  size="sm"
                                  className="w-full"
                                  onClick={() => handleToggle?.(c)}
                                  disabled={isPending}
                                >
                                  {isPending
                                    ? 'Updating…'
                                    : c.isActive
                                      ? 'Deactivate'
                                      : 'Activate'}
                                </Button>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}