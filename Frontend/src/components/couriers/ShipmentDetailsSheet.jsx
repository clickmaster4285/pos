// --- Professional Shipment Details Sheet with Tabs ---
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Truck,
  User,
  Package,
  CreditCard,
  Ruler,
  MapPin,
  Phone,
  Clock,
  AlertCircle,
  Weight,
  Layers,
  Ship,
  FileText,
} from 'lucide-react';
import { useState } from 'react';

export function ShipmentDetailsSheet({
  open,
  onOpenChange,
  shipment,
  currencySymbol,
}) {
  if (!shipment) return null;

  const [activeTab, setActiveTab] = useState('details');
  const codEnabled = !!shipment?.cod?.enabled;
  const codAmount = Number(shipment?.cod?.amount ?? 0).toFixed(2);

  // Status color mapping
  const getStatusVariant = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower?.includes('delivered')) return 'default';
    if (statusLower?.includes('pending') || statusLower?.includes('processing'))
      return 'secondary';
    if (statusLower?.includes('transit') || statusLower?.includes('shipped'))
      return 'default';
    if (statusLower?.includes('failed') || statusLower?.includes('cancelled'))
      return 'destructive';
    return 'outline';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col p-0 w-full sm:max-w-lg lg:max-w-2xl overflow-hidden"
      >
        {/* Header Section */}
        <div className="p-6 pb-3 border-b">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3 ">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl font-semibold text-foreground">
                  Shipment Details
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  AWB:
                  <span className="font-mono font-medium text-foreground bg-muted px-2 py-1 rounded-md text-sm">
                    {shipment.awb || '—'}
                  </span>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Current Status - Prominently Displayed */}
          <div className="flex items-center justify-between mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Current Status:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={getStatusVariant(shipment.statusNormalized)}
                className="text-sm px-3 py-1.5 font-medium"
              >
                {shipment.statusNormalized || shipment.statusRaw || '—'}
              </Badge>
              {shipment?.deleted && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Deleted
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'details'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <FileText className="h-4 w-4" />
              Shipping Details
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'tracking'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <Ship className="h-4 w-4" />
              Tracking
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Shipping Details Tab */}
          {activeTab === 'details' && (
            <div className="p-6 space-y-6">
              {/* Shipping Information */}
              <section className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded">
                    <Truck className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Shipping Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Courier
                    </div>
                    <div className="font-medium text-foreground">
                      {shipment.courierName || shipment.courierCode || '—'}
                    </div>
                  </div>
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created At
                    </div>
                    <div className="font-medium text-foreground">
                      {shipment.createdAt
                        ? new Date(shipment.createdAt).toLocaleString()
                        : '—'}
                    </div>
                  </div>
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Service Level
                    </div>
                    <div className="font-medium text-foreground">
                      {shipment.serviceLevel || '—'}
                    </div>
                  </div>
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Weight className="h-3 w-3" />
                      Weight
                    </div>
                    <div className="font-medium text-foreground">
                      {shipment.weightKg ? `${shipment.weightKg} kg` : '—'}
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Recipient Information */}
              <section className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded">
                    <User className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  Recipient Information
                </h3>
                <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Full Name
                    </div>
                    <div className="font-medium text-foreground text-base">
                      {shipment.recipientName || '—'}
                    </div>
                  </div>

                  {shipment.toPhone && (
                    <div className="flex items-center gap-3 p-2 bg-background rounded-md">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Phone
                        </div>
                        <div className="font-medium text-foreground text-sm">
                          {shipment.toPhone}
                        </div>
                      </div>
                    </div>
                  )}

                  {shipment.toAddress && (
                    <div className="flex items-start gap-3 p-2 bg-background rounded-md">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="space-y-0.5 flex-1">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Delivery Address
                        </div>
                        <div className="font-medium text-foreground text-sm leading-relaxed">
                          {shipment.toAddress}
                          {shipment.toCity && (
                            <span className="block text-muted-foreground mt-0.5">
                              {shipment.toCity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              {/* Payment Information */}
              <section className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded">
                    <CreditCard className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      COD Status
                    </div>
                    <div className="font-medium text-foreground">
                      {codEnabled ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 font-medium">
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-medium">
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      COD Amount
                    </div>
                    <div className="font-medium text-foreground">
                      {codEnabled ? (
                        <span className="text-green-600 font-semibold">
                          {currencySymbol} {codAmount}
                        </span>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Dimensions */}
              {shipment?.dimensions && (
                <>
                  <Separator />
                  <section className="space-y-4">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded">
                        <Ruler className="h-3.5 w-3.5 text-orange-600" />
                      </div>
                      Package Dimensions
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {['length', 'width', 'height'].map((dimension) => (
                        <div
                          key={dimension}
                          className="space-y-2 p-3 bg-muted/30 rounded-lg text-center"
                        >
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {dimension}
                          </div>
                          <div className="font-semibold text-foreground">
                            {shipment.dimensions[dimension]
                              ? `${shipment.dimensions[dimension]} cm`
                              : '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

          {/* Tracking Tab */}
          {activeTab === 'tracking' && (
            <div className="p-6">
              <section className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-6 h-6 bg-amber-100 rounded">
                    <Layers className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  Shipment Timeline
                </h3>

                {Array.isArray(shipment.checkpoints) &&
                  shipment.checkpoints.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {shipment.checkpoints
                      .slice()
                      .reverse()
                      .map((cp, i, array) => (
                        <div
                          key={i}
                          className="flex gap-4 group hover:bg-muted/50 p-3 rounded-lg transition-colors"
                        >
                          {/* Timeline indicator */}
                          <div className="flex flex-col items-center shrink-0">
                            <div
                              className={`w-3 h-3 rounded-full border-2 border-background shadow-sm group-hover:scale-110 transition-transform ${i === 0 ? 'bg-green-500' : 'bg-primary'
                                }`}
                            />
                            {i < array.length - 1 && (
                              <div className="w-0.5 h-full bg-border mt-1 flex-1" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="font-medium text-sm text-foreground leading-tight">
                              {cp.description ||
                                cp.rawStatus ||
                                cp.normalized ||
                                'Status Update'}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {cp.ts ? new Date(cp.ts).toLocaleString() : '—'}
                              {cp.location && (
                                <>
                                  <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                  <MapPin className="h-3 w-3" />
                                  {cp.location}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No tracking updates available</p>
                    <p className="text-sm mt-1">
                      Tracking information will appear here as updates become
                      available
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="p-6 pt-4 border-t bg-muted/20">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto font-medium"
          >
            Close Details
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
