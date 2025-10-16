'use client';

import * as React from 'react';
import { useCreateShipmentMutation } from '@/features/shipmentsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGetCouriersQuery } from '@/features/couriersApi';

export function CreateShipmentForm({ onClose, onCreated, currencySymbol }) {
  const [createShipment, { isLoading }] = useCreateShipmentMutation();

  // fetch couriers dynamically
  const { data: couriersRes, isLoading: loadingCouriers } = useGetCouriersQuery(
    // you can pass params if you want: { environment:'Production', includeDeleted:false }
    {}
  );

  // normalize: accept {data: []} | [] | {items: []}
  const allCouriers = React.useMemo(() => {
    const d = couriersRes;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.items)) return d.items;
    return [];
  }, [couriersRes]);

  // only active, not deleted
  const couriers = React.useMemo(
    () => allCouriers.filter((c) => !c?.deleted && c?.isActive),
    [allCouriers]
  );

  // does this courier have any credential field set?
  const hasCredentials = (c) =>
    !!c?.credentials &&
    Object.values(c.credentials).some(
      (v) => v !== null && v !== '' && v !== undefined
    );

  // only active, not deleted, WITH credentials
  const eligibleCouriers = React.useMemo(
    () =>
      couriers.filter((c) => !c?.deleted && c?.isActive && hasCredentials(c)),
    [couriers]
  );

  const [selectedCourier, setSelectedCourier] = React.useState(null);

  const [form, setForm] = React.useState({
    // courier
    courierId: '',
    courierCode: '',
    courierName: '',
    from_wareHouse: '',

    // recipient
    toName: '',
    toCity: '',
    toAddress: '',
    toPhone: '',

    // parcel
    serviceLevel: 'Standard',
    weightKg: '',
    length: '',
    width: '',
    height: '',

    // COD
    cod: false,
    codAmount: '',
  });

  const onSelectCourier = (id) => {
    const c = couriers.find((x) => (x._id || x.id) === id) || null;
    setSelectedCourier(c);
    setForm((prev) => ({
      ...prev,
      courierId: c?._id || c?.id || '',
      courierCode: c?.code || '',
      courierName: c?.name || '',
    }));
  };

  const validate = () => {
    if (!form.courierId) return 'Please select a courier.';
    if (!form.from_wareHouse?.trim()) return 'From Warehouse is required.';
    if (!form.toName?.trim() || !form.toAddress?.trim() || !form.toCity?.trim())
      return 'Recipient name, address, and city are required.';

    const weight = Number(form.weightKg);
    const L = Number(form.length);
    const W = Number(form.width);
    const H = Number(form.height);

    if (!Number.isFinite(weight) || weight <= 0)
      return 'Weight must be greater than 0.';
    if (!Number.isFinite(L) || L < 0) return 'Length must be 0 or greater.';
    if (!Number.isFinite(W) || W < 0) return 'Width must be 0 or greater.';
    if (!Number.isFinite(H) || H < 0) return 'Height must be 0 or greater.';

    // courier constraints
    if (
      selectedCourier?.maxWeightKg &&
      weight > Number(selectedCourier.maxWeightKg)
    ) {
      return `Weight exceeds courier limit (${selectedCourier.maxWeightKg} kg).`;
    }
    if (form.cod && selectedCourier && selectedCourier.supportsCOD === false) {
      return `COD is not supported by ${
        selectedCourier.name || 'this courier'
      }.`;
    }

    if (form.cod) {
      const codAmt = Number(form.codAmount);
      if (!Number.isFinite(codAmt) || codAmt <= 0)
        return 'COD amount must be greater than 0.';
    }

    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    const payload = {
      courierId: form.courierId,
      courierCode: form.courierCode,
      courierName: form.courierName,
      from_wareHouse: form.from_wareHouse,

      recipientName: form.toName,
      toAddress: form.toAddress,
      toCity: form.toCity,
      toPhone: form.toPhone,

      cod: {
        enabled: !!form.cod,
        amount: form.cod ? Number(form.codAmount) : 0,
      },
      weightKg: Number(form.weightKg),
      dimensions: {
        length: Number(form.length),
        width: Number(form.width),
        height: Number(form.height),
      },
      serviceLevel: form.serviceLevel,

      statusRaw: 'Created',
    };

    try {
      await createShipment(payload).unwrap();
      onCreated?.();
      onClose?.();
    } catch (e) {
      alert(e?.data?.message || e?.error || 'Unable to create shipment');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Courier (fetched) */}
      <div className="grid gap-2">
        <Label>Courier</Label>
        <Select
          value={form.courierId}
          onValueChange={onSelectCourier}
          disabled={loadingCouriers}
        >
          <SelectTrigger className="w-full" aria-label="Select courier">
            <SelectValue
              placeholder={
                loadingCouriers
                  ? 'Loading…'
                  : eligibleCouriers.length
                  ? 'Choose a courier'
                  : 'No eligible couriers'
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {eligibleCouriers.map((c) => {
                const val = c._id || c.id;
                return (
                  <SelectItem key={val} value={String(val)}>
                    {c.name} ({c.code})
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Auto-filled preview (read-only) */}
        {selectedCourier && (
          <div className="text-xs text-muted-foreground mt-1">
            Code: <span className="font-medium">{form.courierCode}</span> ·{' '}
            Name: <span className="font-medium">{form.courierName}</span> · Max:{' '}
            <span className="font-medium">
              {selectedCourier.maxWeightKg ?? '—'} kg
            </span>{' '}
            {selectedCourier.supportsCOD === false && (
              <span className="ml-1">(No COD)</span>
            )}
          </div>
        )}
      </div>

      {/* Service Level */}
      <div className="grid gap-2">
        <Label>Service Level</Label>
        <Select
          value={form.serviceLevel}
          onValueChange={(v) => setForm({ ...form, serviceLevel: v })}
        >
          <SelectTrigger className="w-full" aria-label="Select service level">
            <SelectValue placeholder="Choose service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Standard">Standard</SelectItem>
            <SelectItem value="Express">Express</SelectItem>
            <SelectItem value="Same Day">Same Day</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* From Warehouse */}
      <div className="grid gap-2">
        <Label>From Warehouse</Label>
        <Input
          placeholder="e.g. Lahore Warehouse"
          value={form.from_wareHouse}
          onChange={(e) => setForm({ ...form, from_wareHouse: e.target.value })}
        />
      </div>

      {/* Recipient */}
      <div className="grid gap-2">
        <Label>Recipient Name</Label>
        <Input
          placeholder="Enter recipient name"
          value={form.toName}
          onChange={(e) => setForm({ ...form, toName: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label>Recipient Phone</Label>
        <Input
          placeholder="0305******9"
          value={form.toPhone}
          onChange={(e) => setForm({ ...form, toPhone: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label>Recipient City</Label>
        <Input
          placeholder="Enter recipient city"
          value={form.toCity}
          onChange={(e) => setForm({ ...form, toCity: e.target.value })}
        />
      </div>

      <div className="grid gap-2 md:col-span-3">
        <Label>Recipient Address</Label>
        <Input
          placeholder="Enter recipient address"
          value={form.toAddress}
          onChange={(e) => setForm({ ...form, toAddress: e.target.value })}
        />
      </div>

      {/* Parcel dims/weight */}
      <div className="grid gap-2">
        <Label>Weight (kg)</Label>
        <Input
          placeholder="e.g, 7"
          type="number"
          min={0}
          value={form.weightKg}
          onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Length (cm)</Label>
        <Input
          placeholder="e.g, 4"
          type="number"
          min={0}
          value={form.length}
          onChange={(e) => setForm({ ...form, length: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Width (cm)</Label>
        <Input
          placeholder="e.g, 3"
          type="number"
          min={0}
          value={form.width}
          onChange={(e) => setForm({ ...form, width: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Height (cm)</Label>
        <Input
          placeholder="e.g, 5"
          type="number"
          min={0}
          value={form.height}
          onChange={(e) => setForm({ ...form, height: e.target.value })}
        />
      </div>

      {/* COD */}
      <div className="flex items-center gap-3 md:col-span-3">
        <Switch
          checked={!!form.cod}
          onCheckedChange={(v) => setForm({ ...form, cod: v })}
          id="cod"
          disabled={selectedCourier?.supportsCOD === false}
        />
        <Label htmlFor="cod">
          Cash on Delivery
          {selectedCourier?.supportsCOD === false && ' (Not supported)'}
        </Label>
        {form.cod && (
          <div className="flex items-center gap-2">
            <Label className="text-sm">Amount</Label>
            <Input
              placeholder={`e.g, 70 ${currencySymbol}`}
              className="w-36"
              type="number"
              min={0}
              value={form.codAmount}
              onChange={(e) => setForm({ ...form, codAmount: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="md:col-span-3 flex justify-end">
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Creating...' : 'Create Shipment'}
        </Button>
      </div>
    </div>
  );
}
